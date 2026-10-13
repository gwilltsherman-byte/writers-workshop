/**
 * Local realtime server.
 *
 * This process runs Next.js AND the realtime layer (Socket.IO + Yjs) that
 * Netlify's serverless platform cannot host. All HTTP (pages and every
 * `/api/*` route) is handled by Next.js App Router route handlers, so auth
 * and data behave identically in local dev and on Netlify.
 *
 * Use `npm run dev` for the full experience (realtime included). On Netlify
 * only the Next app is deployed; realtime pages detect the missing socket
 * server and show a graceful "live server required" notice. To power realtime
 * in production, deploy THIS file to a always-on host (Render / Railway / Fly)
 * and point the frontend at it with NEXT_PUBLIC_REALTIME_URL.
 */
import next from "next";
import express from "express";
import { createServer } from "http";
import { Server as IOServer } from "socket.io";
import { WebSocketServer } from "ws";
import { promises as fs } from "fs";
import path from "path";
import { setupWSConnection } from "y-websocket/bin/utils";
import { prisma } from "../src/lib/db";
import { clean } from "../src/lib/profanity";
import { createPromptDeck, toBonusWords, type BonusWord, type GamePrompt } from "../src/lib/prompts";

/* --------------------- matchmaking / game state --------------------- */
type Entrant = { socketId: string; name: string; payload?: any };
const queues: Record<"chat:live" | "critique:short" | "critique:long", Entrant[]> = {
  "chat:live": [], "critique:short": [], "critique:long": [],
};
const makeRoomSlug = (p: string) => `${p}:${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;

type CritRoomState = {
  timer?: NodeJS.Timeout;
  endsAt: number;
  submitted: Set<string>;
  participants: Set<string>;
};
const critRooms = new Map<string, CritRoomState>();

function startCritTimer(io: IOServer, room: string, seconds: number, participants: string[] = []) {
  const endsAt = Date.now() + seconds * 1000;
  const prev = critRooms.get(room);
  if (prev?.timer) clearTimeout(prev.timer);
  const timer = setTimeout(() => {
    critRooms.delete(room);
    io.to(room).emit("crit:ended", { reason: "time_up" });
  }, Math.max(0, endsAt - Date.now()));
  const members = prev?.participants ?? new Set<string>();
  for (const id of participants) members.add(id);
  critRooms.set(room, { timer, endsAt, submitted: prev?.submitted ?? new Set(), participants: members });
  io.to(room).emit("crit:started", { seconds, startedAt: Date.now() });
}
function noteSubmit(io: IOServer, room: string, fromId: string, fromName: string) {
  const st = critRooms.get(room);
  if (!st) return;
  st.submitted.add(fromId);
  critRooms.set(room, st);
  if (st.submitted.size >= 2) {
    if (st.timer) clearTimeout(st.timer);
    critRooms.delete(room);
    io.to(room).emit("crit:ended", { reason: "both_submitted" });
  } else {
    io.to(room).emit("crit:partner-submitted", { fromName });
  }
}

type GameRoom = {
  players: { id: string; name: string }[];
  roles?: Record<string, number>;
  phase: "lobby" | "writing" | "voting" | "results";
  pairs?: [number, number][];
  roundIndex?: number;
  activePair?: [number, number] | null;
  writingEndsAt?: number;
  drafts?: Record<number, string>;
  tally?: Record<number, number>;
  score?: Record<number, number>;
  writingTimer?: NodeJS.Timeout | null;
  prompt?: GamePrompt;
};
const gameRooms = new Map<string, GameRoom>();

// One deck for the whole server, so prompts keep cycling across games.
const promptDeck = createPromptDeck();
// Bonus words come from the same dictionary as the vocab page. Until it loads
// (or if it can't), prompts simply go out without one.
let bonusWords: BonusWord[] = [];
fs.readFile(path.join(process.cwd(), "src", "data", "dictionary.json"), "utf8")
  .then((txt) => { bonusWords = toBonusWords(JSON.parse(txt)); })
  .catch((err) => console.warn("[game] bonus words unavailable:", err?.message || err));

/* ---------------------------------- main ---------------------------------- */
async function main() {
  const dev = process.env.NODE_ENV !== "production";

  // REALTIME_ONLY: run just the Socket.IO + Yjs layer (for an always-on host
  // like Render that powers the realtime features while Netlify serves the
  // site). In that mode we skip Next entirely, so no production build is needed.
  const realtimeOnly = process.env.REALTIME_ONLY === "1" || process.env.REALTIME_ONLY === "true";
  let handle: ((req: any, res: any) => unknown) | null = null;
  if (!realtimeOnly) {
    const app = next({ dev });
    handle = app.getRequestHandler();
    await app.prepare();
  }

  // Normalize to a bare origin so "https://site.netlify.app/" (trailing slash,
  // as copied from the address bar) still matches the browser's Origin header.
  const rawBase = (process.env.APP_BASE_URL || "http://localhost:3000").trim();
  let appOrigin = rawBase.replace(/\/+$/, "");
  try { appOrigin = new URL(rawBase).origin; } catch {}
  const allowedOrigins = new Set([appOrigin, "http://localhost:3000", "http://127.0.0.1:3000"]);

  const expressApp = express();

  // Baseline security headers on every response.
  expressApp.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-DNS-Prefetch-Control", "off");
    next();
  });

  const httpServer = createServer(expressApp);
  const io = new IOServer(httpServer, {
    cors: { origin: (origin, cb) => cb(null, !origin || allowedOrigins.has(origin)) },
    serveClient: false,
  });

  /* --------------------------- sockets ----------------------- */
  io.on("connection", (socket) => {
    socket.on("join", ({ room, name }: { room: string; name: string }) => {
      socket.data.name = name || "Guest";
      socket.join(room);
      socket.emit("joined", { room });
      socket.to(room).emit("presence", { type: "join", name: socket.data.name });
    });

    socket.on("chat:message", async ({ room, text }: { room: string; text: string }) => {
      const name: string = socket.data.name || "Guest";
      const safe = clean(text);
      const msg = await prisma.message.create({
        data: {
          text: safe,
          room: { connectOrCreate: { where: { slug: room }, create: { slug: room, type: "chat" } } },
          user: { connectOrCreate: { where: { name }, create: { name, email: `${name}@example.local` } } },
        },
        include: { user: { select: { name: true } } },
      });
      io.to(room).emit("chat:message", { id: msg.id, from: msg.user.name, text: safe, at: Date.now() });
    });

    socket.on("doc:snapshot", async ({ room, title, html }: { room: string; title: string; html: string }) => {
      await prisma.document.upsert({ where: { roomSlug: room }, update: { title, html }, create: { roomSlug: room, title, html } });
    });

    socket.on("mm:join", async ({ mode, payload }: { mode: "chat:live" | "critique:short" | "critique:long"; payload: any }) => {
      const name = (socket.data.name as string) || "Guest";
      const q = queues[mode];
      const partner = q.find((e) => e.socketId !== socket.id);

      if (partner) {
        queues[mode] = q.filter((e) => e.socketId !== partner.socketId);
        const base = mode === "chat:live" ? "chat:pair" : mode === "critique:short" ? "crit:short" : "crit:long";
        const room = makeRoomSlug(base);

        socket.join(room);
        io.sockets.sockets.get(partner.socketId)?.join(room);
        io.to(socket.id).emit("joined", { room });
        io.to(partner.socketId).emit("joined", { room });

        if (mode === "chat:live") {
          io.to(partner.socketId).emit("mm:paired:chat", { room, partnerName: name });
          io.to(socket.id).emit("mm:paired:chat", { room, partnerName: partner.name });
        } else if (mode === "critique:short") {
          const seconds = Number(payload?.seconds || partner.payload?.seconds || 600);
          const aPiece = payload?.piece || null;
          const bPiece = partner.payload?.piece || null;
          io.to(partner.socketId).emit("mm:paired:short", { room, seconds, startedAt: Date.now(), partnerName: name, partnerPiece: aPiece });
          io.to(socket.id).emit("mm:paired:short", { room, seconds, startedAt: Date.now(), partnerName: partner.name, partnerPiece: bPiece });
          startCritTimer(io, room, seconds, [socket.id, partner.socketId]);
        } else {
          const hours = Number(payload?.hours || partner.payload?.hours || 24);
          const endAt = new Date(Date.now() + hours * 3600 * 1000);
          const session = await prisma.critiqueSession.create({ data: { type: "long", roomSlug: room, hostName: name, endAt } });
          const aPiece = payload?.piece || null;
          const bPiece = partner.payload?.piece || null;
          if (aPiece) await prisma.critiquePiece.create({ data: { sessionId: session.id, author: name, text: String(aPiece.text || "") } });
          if (bPiece) await prisma.critiquePiece.create({ data: { sessionId: session.id, author: partner.name, text: String(bPiece.text || "") } });
          io.to(partner.socketId).emit("mm:paired:long", { room, sessionId: session.id, endAt: endAt.toISOString(), partnerName: name, partnerPiece: aPiece });
          io.to(socket.id).emit("mm:paired:long", { room, sessionId: session.id, endAt: endAt.toISOString(), partnerName: partner.name, partnerPiece: bPiece });
          startCritTimer(io, room, hours * 3600, [socket.id, partner.socketId]);
        }
      } else {
        queues[mode].push({ socketId: socket.id, name, payload });
        io.to(socket.id).emit("mm:waiting", { mode });
      }
    });

    socket.on("mm:leave", ({ mode, room }: { mode: "chat:live" | "critique:short" | "critique:long"; room?: string }) => {
      queues[mode] = queues[mode].filter((e) => e.socketId !== socket.id);
      if (room) {
        const st = critRooms.get(room);
        if (st?.timer) clearTimeout(st.timer);
        critRooms.delete(room);
        socket.to(room).emit("mm:partner-left");
      }
    });

    socket.on("crit:submit", ({ room, text }) => {
      (socket.data as any).__submitted = (socket.data as any).__submitted || new Set<string>();
      const set = (socket.data as any).__submitted as Set<string>;
      if (set.has(room)) return;
      set.add(room);
      io.to(room).emit("crit:submitted", { fromName: socket.data.name, text: clean(text), at: Date.now(), fromId: socket.id });
      noteSubmit(io, room, socket.id, socket.data.name || "Partner");
    });

    socket.on("crit:chat:request", ({ room }) => {
      io.to(room).emit("crit:chat:request", { fromName: socket.data.name, fromId: socket.id });
    });
    socket.on("crit:chat:accept", ({ room }) => {
      io.to(room).emit("crit:chat:started", { by: socket.id });
    });

    /* ----------------------- 6-User Game ---------------------- */
    function emitActiveFlags(room: string) {
      const g = gameRooms.get(room);
      if (!g || !g.roles) return;
      for (const p of g.players) {
        const r = g.roles[p.id];
        const active = Boolean(g.activePair?.includes(r));
        io.to(p.id).emit("game:active", { active });
      }
    }
    function startGame(room: string) {
      const g = gameRooms.get(room);
      if (!g) return;
      const roles = [1, 2, 3, 4, 5, 6].sort(() => Math.random() - 0.5);
      const map: Record<string, number> = {};
      g.players.forEach((p, i) => (map[p.id] = roles[i]));
      g.roles = map;
      g.score = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
      g.pairs = [[1, 2], [3, 4], [5, 6]];
      g.roundIndex = 0;
      g.phase = "writing";
      g.drafts = {};
      g.tally = {};
      g.activePair = g.pairs[g.roundIndex]!;
      g.writingEndsAt = Date.now() + 5 * 60 * 1000;
      g.prompt = promptDeck.next(bonusWords);
      g.players.forEach((p) => io.to(p.id).emit("game:role", { role: g!.roles![p.id] }));
      io.to(room).emit("game:phase", { phase: "writing", pair: g.activePair, writingEndsAt: g.writingEndsAt, drafts: g.drafts, roundIndex: g.roundIndex, score: g.score, prompt: g.prompt });
      emitActiveFlags(room);
      if (g.writingTimer) clearTimeout(g.writingTimer);
      g.writingTimer = setTimeout(() => endWriting(room), Math.max(0, (g.writingEndsAt || Date.now()) - Date.now()));
      gameRooms.set(room, g);
    }
    function endWriting(room: string) {
      const g = gameRooms.get(room);
      if (!g || g.phase !== "writing" || !g.activePair) return;
      g.phase = "voting";
      g.tally = {};
      gameRooms.set(room, g);
      io.to(room).emit("game:phase", { phase: "voting", pair: g.activePair, drafts: g.drafts || {}, tally: g.tally, roundIndex: g.roundIndex, score: g.score, prompt: g.prompt });
      emitActiveFlags(room);
    }
    function finishRound(room: string) {
      const g = gameRooms.get(room);
      if (!g || !g.activePair) return;
      const [a, b] = g.activePair;
      const va = g.tally?.[a] || 0;
      const vb = g.tally?.[b] || 0;
      const winner = va === vb ? ((g.drafts?.[a] || "").length >= (g.drafts?.[b] || "").length ? a : b) : (va > vb ? a : b);
      g.score![winner] = (g.score![winner] || 0) + 1;

      g.roundIndex! += 1;
      if (g.roundIndex! >= (g.pairs?.length || 0)) {
        g.phase = "results";
        gameRooms.set(room, g);
        io.to(room).emit("game:results", { score: g.score });
      } else {
        g.phase = "writing";
        g.activePair = g.pairs![g.roundIndex!];
        g.drafts = {};
        g.tally = {};
        g.writingEndsAt = Date.now() + 5 * 60 * 1000;
        g.prompt = promptDeck.next(bonusWords);
        gameRooms.set(room, g);
        io.to(room).emit("game:phase", { phase: "writing", pair: g.activePair, writingEndsAt: g.writingEndsAt, drafts: g.drafts, roundIndex: g.roundIndex, score: g.score, prompt: g.prompt });
        emitActiveFlags(room);
        if (g.writingTimer) clearTimeout(g.writingTimer);
        g.writingTimer = setTimeout(() => endWriting(room), Math.max(0, (g.writingEndsAt || Date.now()) - Date.now()));
      }
    }

    socket.on("game:join", ({ room, name }: { room: string; name: string }) => {
      socket.join(room);
      const g = gameRooms.get(room) ?? { players: [], phase: "lobby" as const };
      if (!g.players.find((p) => p.id === socket.id)) g.players.push({ id: socket.id, name });
      gameRooms.set(room, g);
      io.to(room).emit("game:lobby", { count: g.players.length, players: g.players.map((p) => p.name) });

      if (g.roles && g.roles[socket.id]) {
        io.to(socket.id).emit("game:role", { role: g.roles[socket.id] });
        io.to(socket.id).emit("game:active", { active: Boolean(g.activePair?.includes(g.roles[socket.id])) });
      }
      if (g.phase === "writing") {
        io.to(socket.id).emit("game:phase", { phase: "writing", pair: g.activePair, writingEndsAt: g.writingEndsAt, drafts: g.drafts, roundIndex: g.roundIndex, score: g.score, prompt: g.prompt });
      } else if (g.phase === "voting") {
        io.to(socket.id).emit("game:phase", { phase: "voting", pair: g.activePair, drafts: g.drafts, tally: g.tally, roundIndex: g.roundIndex, score: g.score, prompt: g.prompt });
      } else if (g.phase === "results") {
        io.to(socket.id).emit("game:results", { score: g.score });
      }

      if (g.phase === "lobby" && g.players.length === 6) startGame(room);
    });

    socket.on("game:start", ({ room }: { room: string }) => {
      const g = gameRooms.get(room);
      if (!g || g.players.length < 6) { io.to(socket.id).emit("game:error", { message: "Need 6 players to start." }); return; }
      startGame(room);
    });

    socket.on("game:leave", ({ room }: { room: string }) => {
      const g = gameRooms.get(room);
      if (!g) return;
      g.players = g.players.filter((p) => p.id !== socket.id);
      io.to(room).emit("game:lobby", { count: g.players.length, players: g.players.map((p) => p.name) });
    });

    socket.on("game:typing", ({ room, text }: { room: string; text: string }) => {
      const g = gameRooms.get(room);
      if (!g || g.phase !== "writing" || !g.activePair || !g.roles) return;
      const role = g.roles[socket.id];
      if (!role || !g.activePair.includes(role)) return;
      g.drafts = g.drafts || {};
      g.drafts[role] = clean(String(text || ""));
      gameRooms.set(room, g);
      socket.to(room).emit("game:typing", { role, text: g.drafts[role] });
    });

    socket.on("game:vote", ({ room, voteForRole }: { room: string; voteForRole: number }) => {
      const g = gameRooms.get(room);
      if (!g || g.phase !== "voting" || !g.activePair || !g.roles) return;
      const myRole = g.roles[socket.id];
      if (!myRole || g.activePair.includes(myRole)) return;
      g.tally = g.tally || {};
      g.tally[voteForRole] = (g.tally[voteForRole] || 0) + 1;
      gameRooms.set(room, g);
      io.to(room).emit("game:tally", { tally: g.tally });
      const totalVotes = Object.values(g.tally).reduce((a, b) => a + b, 0);
      if (totalVotes >= Math.max(0, (g.players?.length || 0) - 2)) finishRound(room);
    });

    socket.on("disconnect", () => {
      (Object.keys(queues) as Array<keyof typeof queues>).forEach((k) => {
        queues[k] = queues[k].filter((e) => e.socketId !== socket.id);
      });
      for (const [room, st] of critRooms) {
        if (!st.participants.has(socket.id)) continue;
        if (st.timer) clearTimeout(st.timer);
        critRooms.delete(room);
        socket.to(room).emit("mm:partner-left");
      }
      for (const [room, g] of gameRooms) {
        const before = g.players.length;
        g.players = g.players.filter((p) => p.id !== socket.id);
        if (g.players.length === 0) {
          if (g.writingTimer) clearTimeout(g.writingTimer);
          gameRooms.delete(room);
        } else if (g.players.length !== before) {
          io.to(room).emit("game:lobby", { count: g.players.length, players: g.players.map((p) => p.name) });
        }
      }
    });
  });

  // Yjs collaborative editing over WebSocket (also serverless-incompatible).
  const wss = new WebSocketServer({ noServer: true });
  httpServer.on("upgrade", (request, socket, head) => {
    const { url } = request as { url?: string };
    if (url && url.startsWith("/yjs")) wss.handleUpgrade(request, socket as any, head, (ws: any) => setupWSConnection(ws, request));
    else if (!(url && url.startsWith("/socket.io"))) socket.destroy();
  });

  if (realtimeOnly) {
    // Health check + friendly root for the standalone realtime host.
    expressApp.get("/healthz", (_req, res) => res.json({ ok: true, mode: "realtime" }));
    expressApp.get("*", (_req, res) => res.type("text").send("Writers' Workshop realtime server is up and running."));
  } else {
    // Everything else (pages + /api route handlers) is served by Next.js.
    expressApp.all("*", (req, res) => handle!(req, res));
  }

  const port = process.env.PORT || 3000;
  httpServer.listen(port, () =>
    console.log(`[writers-workshop] ${realtimeOnly ? "realtime-only" : "realtime + web"} ready on http://localhost:${port}`)
  );
}
main().catch((err) => { console.error(err); process.exit(1); });
