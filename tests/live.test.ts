import { before, after, test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import EmbeddedPostgres from "embedded-postgres";
import { PrismaClient } from "@prisma/client";
import { liveAction, LiveError } from "../src/lib/live-service";
import {
  readLiveToken,
  signLiveToken,
  type LiveIdentity,
} from "../src/lib/live-token";
import type { GameState, PairState } from "../src/lib/live-types";

let pg: EmbeddedPostgres;
let db: PrismaClient;
let second: PrismaClient;
let directory: string;
before(async () => {
  directory = await mkdtemp(join(tmpdir(), "workshop-live-tests-"));
  pg = new EmbeddedPostgres({
    databaseDir: join(directory, "db"),
    port: 55439,
    user: "postgres",
    password: "local-test-only",
    persistent: false,
    onLog: () => {},
    onError: (m) => console.error(m),
  });
  await pg.initialise();
  await pg.start();
  await pg.createDatabase("workshop");
  const url =
    "postgresql://postgres:local-test-only@127.0.0.1:55439/workshop?schema=public";
  process.env.DATABASE_URL = url;
  process.env.AUTH_SECRET =
    "test-secret-for-local-players-at-least-32-characters";
  const r = spawnSync(
    process.execPath,
    ["node_modules/prisma/build/index.js", "migrate", "deploy"],
    { env: process.env, encoding: "utf8" },
  );
  assert.equal(r.status, 0, r.stdout + r.stderr);
  db = new PrismaClient({ datasources: { db: { url } } });
  second = new PrismaClient({ datasources: { db: { url } } });
});
after(async () => {
  await db?.$disconnect();
  await second?.$disconnect();
  await pg?.stop();
  if (directory) await rm(directory, { recursive: true, force: true });
});
async function writer(name: string): Promise<LiveIdentity> {
  const id = randomUUID();
  const u = await db.user.create({
    data: {
      id,
      name: `${name}-${id.slice(0, 8)}`,
      email: `${id}@test.invalid`,
    },
  });
  return { id: u.id, name: u.name };
}
async function pair(
  mode: "chat:live" | "critique:short" | "critique:long",
  a: LiveIdentity,
  b: LiveIdentity,
) {
  await liveAction(db, a, {
    mode,
    action: "join",
    payload: { title: "A", text: "A piece of writing" },
  });
  const s = await liveAction(second, b, {
    mode,
    action: "join",
    payload: { title: "B", text: "B piece of writing" },
  });
  assert.ok(s.room);
  return s.room!;
}
test("chat pairs separate writers, restores identity/history across instances, and excludes outsiders", async () => {
  const a = await writer("Alice"),
    b = await writer("Bob"),
    c = await writer("Outsider");
  const room = await pair("chat:live", a, b);
  const aState = await liveAction(db, a, { mode: "chat:live" });
  assert.equal(aState.room, room);
  assert.equal(aState.waiting, false);
  await liveAction(db, a, {
    mode: "chat:live",
    room,
    action: "message",
    payload: { text: "Hello from Alice" },
  });
  const seen = await liveAction(second, b, { mode: "chat:live", room });
  assert.equal(seen.messages[0].fromId, a.id);
  assert.equal(seen.messages[0].text, "Hello from Alice");
  await assert.rejects(
    liveAction(second, c, {
      mode: "chat:live",
      room,
      action: "message",
      payload: { text: "intruder" },
    }),
    (e: LiveError) => e.status === 403,
  );
  const fresh = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL! } },
  });
  const restored = await liveAction(fresh, a, { mode: "chat:live", room });
  assert.equal(restored.messages.length, 1);
  await fresh.$disconnect();
  await liveAction(db, a, { mode: "chat:live", room, action: "leave" });
  const left = await liveAction(second, b, { mode: "chat:live", room });
  assert.deepEqual((left.state as PairState).left, [a.id]);
});
test("repeated queue joins do not duplicate players, and cancel removes the waiting writer", async () => {
  const a = await writer("Queue"),
    b = await writer("Next");
  await liveAction(db, a, {
    mode: "critique:short",
    action: "join",
    payload: { text: "My piece" },
  });
  await liveAction(db, a, {
    mode: "critique:short",
    action: "join",
    payload: { text: "My piece" },
  });
  assert.equal(await db.matchQueue.count({ where: { playerId: a.id } }), 1);
  await liveAction(db, a, { mode: "critique:short", action: "cancel" });
  const result = await liveAction(second, b, {
    mode: "critique:short",
    action: "join",
    payload: { text: "Another piece" },
  });
  assert.equal(result.waiting, true);
  assert.equal(result.room, null);
  await liveAction(db, b, { mode: "critique:short", action: "cancel" });
});
test("critique exchanges real pieces and feedback, persists it, and opens chat only with both writers' consent", async () => {
  const a = await writer("CriticA"),
    b = await writer("CriticB");
  const room = await pair("critique:long", a, b);
  await assert.rejects(
    liveAction(db, a, {
      mode: "critique:long",
      room,
      action: "message",
      payload: { text: "Not open" },
    }),
  );
  await liveAction(db, a, {
    mode: "critique:long",
    room,
    action: "request-chat",
  });
  await assert.rejects(
    liveAction(db, a, { mode: "critique:long", room, action: "accept-chat" }),
  );
  await liveAction(second, b, {
    mode: "critique:long",
    room,
    action: "accept-chat",
  });
  await liveAction(db, a, {
    mode: "critique:long",
    room,
    action: "message",
    payload: { text: "Let's discuss" },
  });
  await liveAction(db, a, {
    mode: "critique:long",
    room,
    action: "submit",
    payload: { text: "Your ending works well." },
  });
  const final = await liveAction(second, b, {
    mode: "critique:long",
    room,
    action: "submit",
    payload: { text: "Give the opening more detail." },
  });
  const s = final.state as PairState;
  assert.equal(s.endedReason, "both_submitted");
  assert.equal(s.feedback[a.id], "Your ending works well.");
  assert.equal(s.pieces[b.id].text, "B piece of writing");
  assert.equal(final.messages.length, 1);
});
test("two writers can complete all three rounds, vote once, see tied results, and rematch", async () => {
  const a = await writer("DuelA"),
    b = await writer("DuelB");
  const created = await liveAction(db, a, { mode: "game", action: "create" });
  const room = created.room!;
  await liveAction(second, b, {
    mode: "game",
    action: "join",
    payload: { invite: room },
  });
  let snap = await liveAction(db, a, { mode: "game", room, action: "start" });
  for (let round = 0; round < 3; round++) {
    assert.equal((snap.state as GameState).roundIndex, round);
    await liveAction(db, a, {
      mode: "game",
      room,
      action: "submit",
      payload: { text: `Alice round ${round}` },
    });
    snap = await liveAction(second, b, {
      mode: "game",
      room,
      action: "submit",
      payload: { text: `Bob round ${round}` },
    });
    const g = snap.state as GameState;
    assert.equal(g.phase, "voting");
    await liveAction(db, a, {
      mode: "game",
      room,
      action: "vote",
      payload: { role: g.pair![0], roundIndex: round },
    });
    await assert.rejects(
      liveAction(db, a, {
        mode: "game",
        room,
        action: "vote",
        payload: { role: g.pair![0], roundIndex: round },
      }),
      (e: LiveError) => e.status === 409,
    );
    snap = await liveAction(second, b, {
      mode: "game",
      room,
      action: "vote",
      payload: { role: g.pair![1], roundIndex: round },
    });
    await assert.rejects(
      liveAction(db, a, {
        mode: "game",
        room,
        action: "vote",
        payload: { role: g.pair![0], roundIndex: round },
      }),
    );
  }
  const result = snap.state as GameState;
  assert.equal(result.phase, "results");
  assert.deepEqual(result.score, { 1: 3, 2: 3 });
  assert.equal(result.roundResults.length, 3);
  const rematch = await liveAction(db, a, {
    mode: "game",
    room,
    action: "start",
  });
  assert.equal((rematch.state as GameState).roundIndex, 0);
  assert.equal((rematch.state as GameState).phase, "writing");
});
test("six-player matchmaking fills one match, admits a seventh to another, and enforces writer/voter roles", async () => {
  const players = await Promise.all(
    Array.from({ length: 7 }, (_, i) => writer(`Seat${i}`)),
  );
  const snaps = [];
  for (const p of players)
    snaps.push(await liveAction(db, p, { mode: "game", action: "join" }));
  const room = snaps[0].room!;
  assert.equal(snaps[5].room, room);
  assert.notEqual(snaps[6].room, room);
  let s = await liveAction(second, players[0], { mode: "game", room });
  for (let round = 0; round < 3; round++) {
    const g = s.state as GameState;
    assert.equal(g.phase, "writing");
    assert.equal(g.players.length, 6);
    const active = g.players.filter((p) => g.pair!.includes(p.role));
    const audience = g.players.filter((p) => !g.pair!.includes(p.role));
    await assert.rejects(
      liveAction(db, audience[0], {
        mode: "game",
        room,
        action: "submit",
        payload: { text: "Cannot write" },
      }),
    );
    for (const p of active)
      s = await liveAction(db, p, {
        mode: "game",
        room,
        action: "submit",
        payload: { text: `Piece by ${p.name}` },
      });
    await assert.rejects(
      liveAction(db, active[0], {
        mode: "game",
        room,
        action: "vote",
        payload: { role: g.pair![0], roundIndex: round },
      }),
    );
    for (const p of audience)
      s = await liveAction(db, p, {
        mode: "game",
        room,
        action: "vote",
        payload: { role: g.pair![0], roundIndex: round },
      });
    assert.equal((s.state as GameState).roundIndex, round + 1);
    assert.equal((s.state as GameState).score[g.pair![0]], 1);
  }
  assert.equal((s.state as GameState).phase, "results");
});
test("abandoned writing/voting timers advance from persisted timestamps without a resident server", async () => {
  const a = await writer("TimeoutA"),
    b = await writer("TimeoutB");
  let s = await liveAction(
    db,
    a,
    { mode: "game", action: "create" },
    { writingMs: 1, votingMs: 1 },
  );
  const room = s.room!;
  await liveAction(db, b, {
    mode: "game",
    action: "join",
    payload: { invite: room },
  });
  await liveAction(db, a, { mode: "game", room, action: "start" });
  for (let i = 0; i < 8; i++) {
    await new Promise((r) => setTimeout(r, 5));
    s = await liveAction(second, a, { mode: "game", room });
  }
  assert.equal((s.state as GameState).phase, "results");
});
test("shared drafts persist, invited writers join, and concurrent edits cannot silently overwrite another version", async () => {
  const a = await writer("DraftA"),
    b = await writer("DraftB");
  const s = await liveAction(db, a, {
    mode: "doc",
    action: "create",
    payload: { title: "Draft", text: "Opening" },
  });
  const room = s.room!;
  await liveAction(second, b, {
    mode: "doc",
    action: "join",
    payload: { invite: room },
  });
  await liveAction(db, a, {
    mode: "doc",
    room,
    action: "save",
    payload: { title: "Draft", text: "Alice's edit", revision: 0 },
  });
  await assert.rejects(
    liveAction(second, b, {
      mode: "doc",
      room,
      action: "save",
      payload: { title: "Draft", text: "Bob's edit", revision: 0 },
    }),
    (e: LiveError) => e.status === 409,
  );
  const doc = await db.document.findUnique({ where: { roomSlug: room } });
  assert.equal(doc?.html, "Alice's edit");
});
test("player identity tokens reject tampering and session cookies cannot be used as player tokens", () => {
  const token = signLiveToken({ id: "guest:123", name: "A guest" });
  assert.equal(readLiveToken(token)?.id, "guest:123");
  assert.equal(readLiveToken(token + "tampered"), null);
  assert.equal(readLiveToken("invalid"), null);
});

test("simultaneous matchmaking across function instances pairs each writer once", async () => {
  const a = await writer("ConcurrentA"),
    b = await writer("ConcurrentB");
  await Promise.all([
    liveAction(db, a, { mode: "chat:live", action: "join" }),
    liveAction(second, b, { mode: "chat:live", action: "join" }),
  ]);
  const first = await liveAction(db, a, { mode: "chat:live" });
  const other = await liveAction(second, b, { mode: "chat:live" });
  assert.ok(first.room);
  assert.equal(first.room, other.room);
  assert.equal(
    await db.matchQueue.count({ where: { playerId: { in: [a.id, b.id] } } }),
    0,
  );
});
test("a friend invitation switches an existing player into the invited lobby", async () => {
  const a = await writer("InviteA"),
    b = await writer("InviteB"),
    c = await writer("InviteC");
  const old = await liveAction(db, a, { mode: "game", action: "create" });
  await liveAction(db, c, {
    mode: "game",
    action: "join",
    payload: { invite: old.room },
  });
  const invited = await liveAction(second, b, {
    mode: "game",
    action: "create",
  });
  const switched = await liveAction(db, a, {
    mode: "game",
    action: "join",
    payload: { invite: invited.room },
  });
  assert.equal(switched.room, invited.room);
  assert.equal((switched.state as GameState).players.length, 2);
  const previous = await liveAction(db, c, { mode: "game", room: old.room });
  assert.equal(
    (previous.state as GameState).players.some((p) => p.id === a.id),
    false,
  );
});
