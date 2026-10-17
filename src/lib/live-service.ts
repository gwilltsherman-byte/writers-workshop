import { randomUUID } from "node:crypto";
import type { Prisma, PrismaClient } from "@prisma/client";
import type { LiveIdentity } from "./live-token";
import type {
  Mode,
  PairState,
  GameState,
  DocState,
  LiveSnapshot,
  Player,
} from "./live-types";
import { createPromptDeck } from "./prompts";
import { clean } from "./profanity";

type Tx = Prisma.TransactionClient;
type State = PairState | GameState | DocState;
const modes: Mode[] = [
  "chat:live",
  "critique:short",
  "critique:long",
  "game",
  "doc",
];
const deck = createPromptDeck();
export class LiveError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
function text(value: unknown, limit: number, required = false) {
  if (
    typeof value !== "string" ||
    value.length > limit ||
    (required && !value.trim())
  )
    throw new LiveError(
      `Please enter text of up to ${limit.toLocaleString()} characters.`,
    );
  return clean(value.trim());
}
function player(me: LiveIdentity, role = 0): Player {
  return { ...me, role, seenAt: Date.now() };
}
function json(state: State) {
  return state as unknown as Prisma.InputJsonValue;
}
function present(p: Player, now: number) {
  return !p.left && p.seenAt > now - 45000;
}
function startRound(g: GameState, now: number) {
  const roles = g.players.map((p) => p.role);
  const a = (g.roundIndex * 2) % roles.length;
  g.pair = [roles[a], roles[(a + 1) % roles.length]];
  g.phase = "writing";
  g.prompt = deck.next();
  g.endsAt = now + g.writingMs;
  g.drafts = {};
  g.submitted = [];
  g.votes = {};
}
function eligible(g: GameState) {
  const remaining = g.players.filter((p) => !p.left);
  return remaining.filter(
    (p) => g.players.length === 2 || !g.pair?.includes(p.role),
  );
}
function advance(g: GameState, now: number) {
  if (g.phase === "writing" && g.pair) {
    const writers = g.players.filter((p) => g.pair!.includes(p.role));
    if (
      now >= g.endsAt! ||
      writers.every((p) => p.left || g.submitted.includes(p.id))
    ) {
      g.phase = "voting";
      g.endsAt = now + g.votingMs;
    }
  }
  if (
    g.phase === "voting" &&
    g.pair &&
    (now >= g.endsAt! || eligible(g).every((p) => g.votes[p.id] !== undefined))
  ) {
    const [a, b] = g.pair;
    const tally: Record<number, number> = { [a]: 0, [b]: 0 };
    for (const p of eligible(g))
      if (g.pair.includes(g.votes[p.id])) tally[g.votes[p.id]]++;
    const winners =
      tally[a] === tally[b]
        ? tally[a]
          ? [a, b]
          : []
        : [tally[a] > tally[b] ? a : b];
    for (const role of winners) g.score[role] = (g.score[role] || 0) + 1;
    g.roundResults.push({
      pair: [a, b],
      drafts: { ...g.drafts },
      tally,
      winners,
    });
    g.roundIndex++;
    if (g.roundIndex >= 3) {
      g.phase = "results";
      g.endsAt = null;
    } else startRound(g, now);
  }
}

// PostgreSQL serializes matchmaking and room changes across independent
// Netlify function instances. No room or timer relies on process memory.
export async function liveAction(
  db: PrismaClient,
  me: LiveIdentity,
  input: {
    mode: Mode;
    room?: string | null;
    action?: string;
    payload?: Record<string, unknown>;
  },
  timing?: { writingMs: number; votingMs: number },
) {
  if (!modes.includes(input.mode)) throw new LiveError("Unknown activity.");
  const action = input.action || "poll";
  const payload = input.payload || {};
  return db.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(731529, 1)`;
      const now = Date.now();
      const active = await tx.room.findMany({
        where: { type: input.mode, memberIds: { has: me.id } },
        orderBy: { updatedAt: "desc" },
        take: 20,
      });
      let room = input.room
        ? await tx.room.findUnique({ where: { slug: input.room } })
        : active.find((r) => {
            const s = r.state as unknown as State;
            return s.kind === "pair"
              ? !s.left.includes(me.id)
              : s.kind === "game"
                ? s.players.some((p) => p.id === me.id && !p.left)
                : false;
          }) || null;
      if (room && (room.type !== input.mode || !room.memberIds.includes(me.id)))
        throw new LiveError("You do not have access to this room.", 403);
      let state = room?.state as unknown as State | undefined;

      if (
        action === "join" &&
        payload.invite &&
        (input.mode === "game" || input.mode === "doc") &&
        room?.slug !== payload.invite
      ) {
        const invited = await tx.room.findUnique({
          where: { slug: text(payload.invite, 80, true) },
        });
        if (!invited || invited.type !== input.mode)
          throw new LiveError("That invitation does not exist.", 404);
        const target = invited.state as unknown as State;
        if (
          target.kind === "game" &&
          !target.players.some((p) => p.id === me.id && !p.left) &&
          (target.phase !== "lobby" ||
            target.players.filter((p) => present(p, now)).length >= 6)
        ) {
          throw new LiveError(
            "That match is already in progress or its lobby is full.",
          );
        }
        if (room && state?.kind === "game") {
          const oldSeat = state.players.find((p) => p.id === me.id);
          if (oldSeat) oldSeat.left = true;
          advance(state, now);
          await tx.room.update({
            where: { id: room.id },
            data: { state: json(state) },
          });
        }
        room = invited.memberIds.includes(me.id) ? invited : null;
        state = room?.state as unknown as State | undefined;
      }

      if (action === "leave" || action === "cancel") {
        await tx.matchQueue.deleteMany({ where: { playerId: me.id } });
        if (room && state?.kind === "pair") {
          if (!state.left.includes(me.id)) state.left.push(me.id);
        }
        if (room && state?.kind === "game") {
          const p = state.players.find((p) => p.id === me.id);
          if (p) p.left = true;
          advance(state, now);
        }
        if (room && state)
          await tx.room.update({
            where: { id: room.id },
            data: { state: json(state) },
          });
        return snapshot(tx, me, null, null, false, now);
      }

      if (
        action === "join" &&
        input.mode !== "game" &&
        input.mode !== "doc" &&
        !room
      ) {
        const piece =
          input.mode === "chat:live"
            ? null
            : {
                title: text(payload.title || "", 200),
                text: text(payload.text, 100000, true),
              };
        const duration =
          input.mode === "critique:long"
            ? Math.min(72, Math.max(1, Number(payload.hours) || 24)) * 3600000
            : Math.min(1800, Math.max(300, Number(payload.seconds) || 600)) *
              1000;
        await tx.matchQueue.deleteMany({
          where: { seenAt: { lt: new Date(now - 45000) } },
        });
        const partner = await tx.matchQueue.findFirst({
          where: { mode: input.mode, playerId: { not: me.id } },
          orderBy: { createdAt: "asc" },
        });
        if (partner) {
          const user = await tx.user.findUnique({
            where: { id: partner.playerId },
          });
          if (!user)
            throw new LiveError(
              "Your partner disconnected. Try matching again.",
            );
          const other = partner.payload as {
            piece?: { title: string; text: string };
            duration?: number;
          };
          const pair: PairState = {
            kind: "pair",
            mode: input.mode,
            players: [player({ id: user.id, name: user.name }), player(me)],
            startedAt: now,
            endsAt: now + Math.min(duration, other.duration || duration),
            pieces: piece ? { [me.id]: piece, [user.id]: other.piece! } : {},
            feedback: {},
            chatLive: input.mode === "chat:live",
            left: [],
          };
          room = await tx.room.create({
            data: {
              slug: `pair:${randomUUID()}`,
              type: input.mode,
              memberIds: [me.id, user.id],
              state: json(pair),
            },
          });
          state = pair;
          await tx.matchQueue.deleteMany({
            where: { playerId: { in: [me.id, user.id] } },
          });
        } else {
          const data = {
            mode: input.mode,
            payload: { ...(piece ? { piece } : {}), duration },
            seenAt: new Date(now),
          };
          await tx.matchQueue.upsert({
            where: { playerId: me.id },
            create: { playerId: me.id, ...data },
            update: data,
          });
        }
      }
      if (
        input.mode === "game" &&
        (action === "join" || action === "create") &&
        !room
      ) {
        if (payload.invite) {
          const invited = await tx.room.findUnique({
            where: { slug: text(payload.invite, 80, true) },
          });
          if (!invited || invited.type !== "game")
            throw new LiveError("That game room does not exist.", 404);
          room = invited;
        } else if (action !== "create") {
          const lobbies = await tx.room.findMany({
            where: { type: "game", updatedAt: { gt: new Date(now - 45000) } },
            orderBy: { createdAt: "asc" },
            take: 50,
          });
          room =
            lobbies.find((r) => {
              const g = r.state as unknown as GameState;
              return (
                g.phase === "lobby" &&
                !g.private &&
                g.players.filter((p) => present(p, now)).length < 6
              );
            }) || null;
        }
        if (!room) {
          const g: GameState = {
            kind: "game",
            phase: "lobby",
            players: [],
            roundIndex: 0,
            pair: null,
            prompt: null,
            endsAt: null,
            drafts: {},
            submitted: [],
            votes: {},
            score: {},
            roundResults: [],
            private: action === "create",
            writingMs: timing?.writingMs || 300000,
            votingMs: timing?.votingMs || 90000,
          };
          room = await tx.room.create({
            data: {
              slug: `game:${randomUUID()}`,
              type: "game",
              memberIds: [],
              state: json(g),
            },
          });
        }
        state = room.state as unknown as GameState;
        if (state.kind !== "game" || state.phase !== "lobby")
          throw new LiveError(
            "That match has already started. Join another lobby.",
          );
        state.players = state.players.filter((p) => present(p, now));
        if (state.players.length >= 6)
          throw new LiveError("That lobby is full.");
        if (!state.players.some((p) => p.id === me.id))
          state.players.push(player(me));
        room.memberIds = state.players.map((p) => p.id);
      }
      if (input.mode === "doc" && action === "create") {
        const doc: DocState = {
          kind: "doc",
          title: text(payload.title || "", 200),
          text: text(payload.text || "", 100000),
          revision: 0,
        };
        room = await tx.room.create({
          data: {
            slug: `doc:${randomUUID()}`,
            type: "doc",
            memberIds: [me.id],
            state: json(doc),
          },
        });
        await tx.document.create({
          data: { roomSlug: room.slug, title: doc.title, html: doc.text },
        });
        state = doc;
      }
      if (
        input.mode === "doc" &&
        action === "join" &&
        !room &&
        payload.invite
      ) {
        const invited = await tx.room.findUnique({
          where: { slug: text(payload.invite, 80, true) },
        });
        if (!invited || invited.type !== "doc")
          throw new LiveError("That shared draft does not exist.", 404);
        room = invited;
        state = invited.state as unknown as DocState;
        if (!room.memberIds.includes(me.id)) room.memberIds.push(me.id);
      }
      if (!room) {
        if (!["poll", "join"].includes(action))
          throw new LiveError("Join a room first.");
        const queue = await tx.matchQueue.findUnique({
          where: { playerId: me.id },
        });
        if (queue?.mode === input.mode)
          await tx.matchQueue.update({
            where: { playerId: me.id },
            data: { seenAt: new Date(now) },
          });
        return snapshot(tx, me, null, null, queue?.mode === input.mode, now);
      }
      if (!state) throw new LiveError("Room unavailable.");
      if (state.kind === "game") {
        const p = state.players.find((p) => p.id === me.id);
        if (!p || p.left) throw new LiveError("You have left this match.", 403);
        p.seenAt = now;
        if (state.phase === "lobby")
          state.players = state.players.filter((p) => present(p, now));
        advance(state, now);
        if (
          action === "start" ||
          (state.phase === "lobby" && state.players.length === 6)
        ) {
          if (!["lobby", "results"].includes(state.phase))
            throw new LiveError("A match is already in progress.");
          state.players = state.players.filter((p) => present(p, now));
          if (state.players.length < 2)
            throw new LiveError("At least two writers are needed.");
          for (let i = state.players.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [state.players[i], state.players[j]] = [
              state.players[j],
              state.players[i],
            ];
          }
          state.players.forEach((p, i) => (p.role = i + 1));
          state.score = {};
          state.roundIndex = 0;
          state.roundResults = [];
          startRound(state, now);
        }
        if (action === "draft" || action === "submit") {
          if (
            state.phase !== "writing" ||
            !state.pair?.includes(p.role) ||
            state.submitted.includes(me.id)
          )
            throw new LiveError("You cannot edit this round.");
          state.drafts[p.role] = text(payload.text, 10000, action === "submit");
          if (action === "submit") state.submitted.push(me.id);
        }
        if (action === "vote") {
          const role = Number(payload.role);
          // Include the round in each vote so a double-click cannot vote in the next round.
          if (
            state.phase !== "voting" ||
            payload.roundIndex !== state.roundIndex ||
            !state.pair?.includes(role) ||
            !eligible(state).some((p) => p.id === me.id)
          )
            throw new LiveError("You cannot vote for that piece.");
          if (state.votes[me.id] !== undefined)
            throw new LiveError("You have already voted this round.", 409);
          state.votes[me.id] = role;
        }
        advance(state, now);
      }
      if (state.kind === "pair") {
        const p = state.players.find((p) => p.id === me.id)!;
        p.seenAt = now;
        if (state.left.includes(me.id))
          throw new LiveError("You have left this session.", 403);
        if (
          state.mode !== "chat:live" &&
          now >= state.endsAt &&
          !state.endedReason
        )
          state.endedReason = "time_up";
        if (action === "submit") {
          if (state.endedReason || state.feedback[me.id])
            throw new LiveError("This critique is already finished.");
          state.feedback[me.id] = text(payload.text, 20000, true);
          if (Object.keys(state.feedback).length === 2)
            state.endedReason = "both_submitted";
        }
        if (action === "request-chat") state.chatRequestedBy = me.id;
        if (action === "accept-chat") {
          if (!state.chatRequestedBy || state.chatRequestedBy === me.id)
            throw new LiveError("Your partner must request the chat first.");
          state.chatLive = true;
          delete state.chatRequestedBy;
        }
        if (action === "decline-chat") delete state.chatRequestedBy;
      }
      if (action === "message") {
        if (state.kind !== "pair" || !state.chatLive || state.left.length)
          throw new LiveError("This chat is not open.");
        const message = text(payload.text, 2000, true);
        const last = await tx.message.findFirst({
          where: { roomId: room.id, userId: me.id },
          orderBy: { createdAt: "desc" },
        });
        if (last && last.createdAt.getTime() > now - 300)
          throw new LiveError(
            "Please wait a moment before sending another message.",
            429,
          );
        await tx.message.create({
          data: { roomId: room.id, userId: me.id, text: message },
        });
      }
      if (state.kind === "doc" && action === "save") {
        if (payload.revision !== state.revision)
          throw new LiveError(
            "Your partner updated this draft. Review their version before saving again.",
            409,
          );
        state.title = text(payload.title || "", 200);
        state.text = text(payload.text, 100000);
        state.revision++;
        await tx.document.upsert({
          where: { roomSlug: room.slug },
          create: { roomSlug: room.slug, title: state.title, html: state.text },
          update: { title: state.title, html: state.text },
        });
      }
      await tx.room.update({
        where: { id: room.id },
        data: { memberIds: room.memberIds, state: json(state) },
      });
      return snapshot(tx, me, room.slug, state, false, now, room.id);
    },
    { maxWait: 10000, timeout: 15000 },
  );
}
async function snapshot(
  tx: Tx,
  me: LiveIdentity,
  room: string | null,
  state: State | null,
  waiting: boolean,
  now: number,
  roomId?: string,
): Promise<LiveSnapshot> {
  const rows =
    roomId && state?.kind === "pair"
      ? await tx.message.findMany({
          where: { roomId },
          orderBy: { createdAt: "desc" },
          take: 100,
          include: { user: { select: { name: true } } },
        })
      : [];
  return {
    identity: me,
    room,
    state,
    waiting,
    serverTime: now,
    messages: rows.reverse().map((m) => ({
      id: m.id,
      fromId: m.userId,
      from: m.user.name,
      text: m.text,
      at: m.createdAt.getTime(),
    })),
  };
}
