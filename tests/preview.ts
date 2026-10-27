import assert from "node:assert/strict";
import { createServer } from "node:net";
import { randomBytes } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import EmbeddedPostgres from "embedded-postgres";
import { PrismaClient } from "@prisma/client";

async function main() {
  const dir = await mkdtemp(join(tmpdir(), "workshop-preview-"));
  const pg = new EmbeddedPostgres({
    databaseDir: join(dir, "db"),
    port: 55440,
    user: "postgres",
    password: "preview-only",
    persistent: false,
    onLog: () => {},
    onError: () => {},
  });
  const mail: string[] = [];
  const smtp = createServer((socket) => {
    socket.setEncoding("utf8");
    socket.write("220 local-test SMTP\r\n");
    let buffer = "",
      message = "",
      data = false;
    socket.on("data", (chunk) => {
      buffer += chunk;
      let end;
      while ((end = buffer.indexOf("\r\n")) >= 0) {
        const line = buffer.slice(0, end);
        buffer = buffer.slice(end + 2);
        if (data) {
          if (line === ".") {
            mail.push(message);
            message = "";
            data = false;
            socket.write("250 accepted\r\n");
          } else message += line + "\n";
          continue;
        }
        if (/^EHLO|^HELO/.test(line)) socket.write("250 local-test\r\n");
        else if (/^DATA/.test(line)) {
          data = true;
          socket.write("354 send message\r\n");
        } else if (/^QUIT/.test(line)) socket.end("221 bye\r\n");
        else socket.write("250 OK\r\n");
      }
    });
  });
  let web: ReturnType<typeof spawn> | undefined;
  let db: PrismaClient | undefined;
  async function cleanup() {
    web?.kill("SIGTERM");
    await new Promise<void>((r) => smtp.close(() => r()));
    await db?.$disconnect();
    await pg.stop();
    await rm(dir, { recursive: true, force: true });
  }
  process.once("SIGTERM", () => {
    void cleanup().then(() => process.exit(0));
  });
  process.once("SIGINT", () => {
    void cleanup().then(() => process.exit(0));
  });
  try {
    await pg.initialise();
    await pg.start();
    await pg.createDatabase("preview");
    const env = {
      ...process.env,
      DATABASE_URL:
        "postgresql://postgres:preview-only@127.0.0.1:55440/preview?schema=public",
      AUTH_SECRET: randomBytes(32).toString("hex"),
      APP_BASE_URL: "http://localhost:3006",
      SMTP_HOST: "127.0.0.1",
      SMTP_PORT: "25265",
      SMTP_USER: "",
      SMTP_PASS: "",
      SMTP_FROM: "Workshop <test@local.invalid>",
      NODE_ENV: "production" as const,
    };
    const migration = spawnSync(
      process.execPath,
      ["node_modules/prisma/build/index.js", "migrate", "deploy"],
      { env, encoding: "utf8" },
    );
    assert.equal(migration.status, 0, migration.stdout + migration.stderr);
    db = new PrismaClient({ datasources: { db: { url: env.DATABASE_URL } } });
    await new Promise<void>((r) => smtp.listen(25265, "127.0.0.1", () => r()));
    web = spawn(
      process.execPath,
      [
        "node_modules/next/dist/bin/next",
        "start",
        "--port",
        "3006",
        "--hostname",
        "127.0.0.1",
      ],
      { env, stdio: ["ignore", "pipe", "pipe"] },
    );
    web?.stderr?.on("data", (d) => process.stderr.write(d));
    let ready = false;
    for (let i = 0; i < 100; i++) {
      try {
        if ((await fetch("http://localhost:3006/api/health")).ok) {
          ready = true;
          break;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 200));
    }
    assert.equal(ready, true, "The production server did not start.");
    async function request(
      path: string,
      body?: unknown,
      token?: string,
      cookie?: string,
    ) {
      const res = await fetch(`http://localhost:3006${path}`, {
        method: body === undefined ? "GET" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(cookie ? { Cookie: cookie } : {}),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      const data = await res.json();
      return { res, data };
    }
    const account = {
      email: "player@local.invalid",
      name: "Local Writer",
      password: "Local-test-password-123",
    };
    let r = await request("/api/auth/signup", account);
    assert.equal(r.res.status, 200);
    assert.equal(
      r.data.devCode,
      undefined,
      "Production must never return email codes.",
    );
    const code = mail.at(-1)?.match(/code is (\d{6})/)?.[1];
    assert.ok(code, "Verification mail must reach the local test mailbox.");
    r = await request("/api/auth/verify", { ...account, code });
    assert.equal(r.res.status, 200);
    let cookie = r.res.headers.get("set-cookie")!.split(";")[0];
    assert.equal(
      (await request("/api/me", undefined, undefined, cookie)).data.name,
      account.name,
    );
    const published = await request(
      "/api/stories",
      {
        title: "Smoke test story",
        html: "A real published story.",
        genres: ["Fiction"],
      },
      undefined,
      cookie,
    );
    assert.equal(published.res.status, 200);
    assert.equal(
      (await request(`/api/stories/${published.data.id}`)).data.story.title,
      "Smoke test story",
    );
    // Historical display names are not ownership, and older genre values can
    // be lowercase. Keep both cases represented in the real HTTP workflow.
    const sameNameStory = await db.story.create({
      data: {
        title: "Another writer with the same display name",
        html: "This belongs to a different account.",
        genres: ["fiction"],
        authorName: account.name,
        authorEmail: "another-writer@local.invalid",
      },
    });
    const previousNameStory = await db.story.create({
      data: {
        title: "A story under an earlier display name",
        html: "This still belongs in the same account library.",
        genres: ["Poetry"],
        authorName: "An earlier pen name",
        authorEmail: account.email,
      },
    });
    for (const genre of ["Fiction", "fiction"]) {
      const filtered = await request(`/api/stories/list?genre=${genre}`);
      assert.equal(filtered.res.status, 200);
      assert.deepEqual(
        filtered.data.items.map((story: { id: string }) => story.id).sort(),
        [published.data.id, sameNameStory.id].sort(),
        "Genre filtering must include canonical and lowercase stored values, and exclude other genres.",
      );
    }
    assert.equal((await request("/api/library")).res.status, 401);
    for (const library of ["/api/library", "/api/my/library"]) {
      assert.deepEqual(
        (await request(library, undefined, undefined, cookie)).data.stories
          .map((story: { id: string }) => story.id)
          .sort(),
        [published.data.id, previousNameStory.id].sort(),
        "The account library must follow account email, including earlier display names and excluding another account with the same name.",
      );
    }
    assert.equal(
      (
        await request("/api/auth/login", {
          email: account.email,
          password: account.password,
        })
      ).res.status,
      200,
    );
    assert.equal(
      (await request("/api/auth/verify", { ...account, code })).res.status,
      409,
    );
    assert.equal(
      (
        await request(
          "/api/account/change-password",
          {
            currentPassword: account.password,
            newPassword: "Changed-local-password-123",
          },
          undefined,
          cookie,
        )
      ).res.status,
      200,
    );
    assert.equal(
      (
        await request("/api/auth/login", {
          email: account.email,
          password: "Changed-local-password-123",
        })
      ).res.status,
      200,
    );
    assert.equal(
      (
        await request(
          "/api/account/request-email-change",
          { newEmail: "updated-player@local.invalid" },
          undefined,
          cookie,
        )
      ).res.status,
      200,
    );
    const emailCode = mail.at(-1)?.match(/code is (\d{6})/)?.[1];
    assert.ok(emailCode);
    const previousSessionCookie = cookie;
    const changed = await request(
      "/api/account/confirm-email-change",
      { newEmail: "updated-player@local.invalid", code: emailCode },
      undefined,
      cookie,
    );
    assert.equal(changed.res.status, 200);
    cookie = changed.res.headers.get("set-cookie")!.split(";")[0];
    assert.equal(
      (await request("/api/me", undefined, undefined, cookie)).data.email,
      "updated-player@local.invalid",
    );
    assert.equal(
      (await request("/api/me", undefined, undefined, previousSessionCookie))
        .data.email,
      "updated-player@local.invalid",
      "A session opened before an email change must resolve the current account identity.",
    );
    await db.story.create({
      data: {
        title: "Work belonging to the released email address",
        html: "An older session must not gain access to this account's library.",
        genres: ["Essay"],
        authorName: "Another account",
        authorEmail: account.email,
      },
    });
    for (const library of ["/api/library", "/api/my/library"]) {
      for (const sessionCookie of [cookie, previousSessionCookie]) {
        assert.deepEqual(
          (
            await request(library, undefined, undefined, sessionCookie)
          ).data.stories
            .map((story: { id: string }) => story.id)
            .sort(),
          [published.data.id, previousNameStory.id].sort(),
          "Both existing and refreshed sessions must retain the same library and exclude work assigned to the released email address.",
        );
      }
    }
    const publishedFromOlderSession = await request(
      "/api/stories",
      {
        title: "Published from another existing session",
        html: "This must use the account's current email.",
        genres: ["Fiction"],
      },
      undefined,
      previousSessionCookie,
    );
    assert.equal(publishedFromOlderSession.res.status, 200);
    const currentOwnership = await db.story.findUniqueOrThrow({
      where: { id: publishedFromOlderSession.data.id },
    });
    assert.equal(
      currentOwnership.authorEmail,
      "updated-player@local.invalid",
      "An older cookie must publish using the current account email.",
    );
    for (const library of ["/api/library", "/api/my/library"]) {
      assert.deepEqual(
        (
          await request(library, undefined, undefined, previousSessionCookie)
        ).data.stories
          .map((story: { id: string }) => story.id)
          .sort(),
        [
          published.data.id,
          previousNameStory.id,
          publishedFromOlderSession.data.id,
        ].sort(),
      );
    }
    assert.equal((await request("/api/vocab/random")).res.status, 200);
    const accountPlayer = (
      await request("/api/realtime/session", {}, undefined, cookie)
    ).data;
    const sharedDraft = await request(
      "/api/live",
      {
        mode: "doc",
        action: "create",
        payload: {
          title: "A new shared draft",
          text: "Saved on the first create.",
        },
      },
      accountPlayer.token,
      cookie,
    );
    assert.equal(sharedDraft.res.status, 200);
    const libraryWithDraft = await request(
      "/api/library",
      undefined,
      undefined,
      cookie,
    );
    assert.ok(
      libraryWithDraft.data.docs.some(
        (doc: { roomSlug: string; html: string }) =>
          doc.roomSlug === sharedDraft.data.room &&
          doc.html === "Saved on the first create.",
      ),
      "A newly created shared draft must appear in the account library without a second save.",
    );
    const alice = (await request("/api/realtime/session", {})).data,
      bob = (await request("/api/realtime/session", {})).data;
    assert.notEqual(alice.id, bob.id);
    assert.equal(
      (await request("/api/realtime/session", { token: alice.token })).data.id,
      alice.id,
    );
    await request(
      "/api/live",
      { mode: "chat:live", action: "join" },
      alice.token,
    );
    const paired = await request(
      "/api/live",
      { mode: "chat:live", action: "join" },
      bob.token,
    );
    const room = paired.data.room;
    assert.ok(room);
    assert.equal(
      (
        await request(
          "/api/live",
          {
            mode: "chat:live",
            room,
            action: "message",
            payload: { text: "Hello from another browser." },
          },
          alice.token,
        )
      ).res.status,
      200,
    );
    const seen = await request(
      "/api/live",
      { mode: "chat:live", room },
      bob.token,
    );
    assert.equal(seen.data.messages[0].text, "Hello from another browser.");
    assert.equal(
      (
        await request(
          `/api/history/${encodeURIComponent(room)}`,
          undefined,
          bob.token,
        )
      ).data[0].fromId,
      alice.id,
    );
    assert.equal(
      (await request(`/api/history/${encodeURIComponent(room)}`)).res.status,
      401,
    );
    assert.equal(
      (await request("/api/live", { mode: "game", action: "join" })).res.status,
      401,
    );
    console.log(
      "Production HTTP smoke checks passed: signup email, verification, login, publishing, case-compatible genre filters, account-owned library, vocabulary, guest identities, chat and private history.",
    );
    console.log("Local preview ready: http://localhost:3006");
    if (process.argv.includes("--preview")) await new Promise(() => {});
    else await cleanup();
  } catch (e) {
    await cleanup();
    throw e;
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
