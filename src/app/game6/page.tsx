"use client";

import React, { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { AppShell } from "@/components/shell";
import { PageHeader } from "@/components/ui";
import { IndexCard } from "@/components/IndexCard";
import RealtimeNotice from "@/components/RealtimeNotice";
import { useRealtime } from "@/lib/realtime";
import type { GamePrompt } from "@/lib/prompts";

const SAVE_KEY = "session:game6";
const ROOM = "game:main";

export default function Game6Page() {
  const rt = useRealtime();
  const socketRef = useRef<Socket | null>(null);
  // Read inside socket handlers, so the socket doesn't have to reconnect when it changes.
  const roleRef = useRef<number | null>(null);

  const [joined, setJoined] = useState(false);
  const [resumeAvailable, setResumeAvailable] = useState(false);
  const [lobby, setLobby] = useState<{ count: number; players: string[] }>({ count: 0, players: [] });
  const [role, setRole] = useState<number | null>(null);
  const [phase, setPhase] = useState<"lobby" | "writing" | "voting" | "results">("lobby");
  const [pair, setPair] = useState<[number, number] | null>(null);
  const [prompt, setPrompt] = useState<GamePrompt | null>(null);
  const [roundIndex, setRoundIndex] = useState(0);
  const [writingEndsAt, setWritingEndsAt] = useState<number | null>(null);
  const [myDraft, setMyDraft] = useState("");
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [tally, setTally] = useState<Record<number, number>>({});
  const [score, setScore] = useState<Record<number, number>>({});
  const [canWrite, setCanWrite] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => { const id = setInterval(() => setTick((x) => x + 1), 1000); return () => clearInterval(id); }, []);
  const timeLeft = writingEndsAt ? Math.max(0, Math.floor((writingEndsAt - Date.now()) / 1000)) : 0;
  const mmss = `${String(Math.floor(timeLeft / 60)).padStart(2, "0")}:${String(timeLeft % 60).padStart(2, "0")}`;

  useEffect(() => {
    try { const raw = localStorage.getItem(SAVE_KEY); if (raw) { const st = JSON.parse(raw); if (st?.joined) setResumeAvailable(true); } } catch {}
  }, []);

  useEffect(() => {
    if (rt.status !== "enabled") return;
    const s = io(rt.url || undefined); socketRef.current = s;

    s.on("game:lobby", (p) => setLobby(p));
    s.on("game:role", (p: { role: number }) => { roleRef.current = p.role; setRole(p.role); });
    s.on("game:phase", (p: any) => {
      setPhase(p.phase);
      setPrompt(p.prompt || null);
      setRoundIndex(p.roundIndex || 0);
      if (p.phase === "writing") {
        setPair(p.pair); setWritingEndsAt(p.writingEndsAt || null);
        setDrafts(p.drafts || {}); setTally({}); setScore(p.score || {});
        setCanWrite(roleRef.current ? Boolean(p.pair?.includes(roleRef.current)) : false);
      } else if (p.phase === "voting") {
        setPair(p.pair); setDrafts(p.drafts || {}); setTally(p.tally || {}); setScore(p.score || {}); setCanWrite(false);
      }
      if (p.score) setScore(p.score);
    });
    s.on("game:active", ({ active }: { active: boolean }) => setCanWrite(active));
    s.on("game:typing", ({ role, text }: { role: number; text: string }) => setDrafts((d) => ({ ...d, [role]: text })));
    s.on("game:tally", ({ tally }: { tally: Record<number, number> }) => setTally(tally));
    s.on("game:results", ({ score }: { score: Record<number, number> }) => { setPhase("results"); setScore(score || {}); setCanWrite(false); });

    return () => { s.close(); };
  }, [rt.status, rt.url]);

  function join() {
    socketRef.current?.emit("game:join", { room: ROOM, name: "You" });
    setJoined(true); setResumeAvailable(false);
    try { localStorage.setItem(SAVE_KEY, JSON.stringify({ joined: true })); } catch {}
  }
  function leave() {
    socketRef.current?.emit("game:leave", { room: ROOM });
    roleRef.current = null;
    setJoined(false); setRole(null); setPhase("lobby"); setPair(null); setPrompt(null); setDrafts({}); setTally({}); setScore({}); setCanWrite(false);
    try { localStorage.removeItem(SAVE_KEY); } catch {}
  }
  function startNow() { socketRef.current?.emit("game:start", { room: ROOM }); }
  function onType(val: string) { setMyDraft(val); if (phase === "writing" && canWrite) socketRef.current?.emit("game:typing", { room: ROOM, text: val }); }
  function vote(r: number) { socketRef.current?.emit("game:vote", { room: ROOM, voteForRole: r }); }

  const promptBox = prompt && (
    <IndexCard label={`Round ${roundIndex + 1} of 3`} cardKey={roundIndex} className="mt-5 max-w-2xl">
      <p>{prompt.text}</p>
      {prompt.twist && <p><span className="font-bold">The catch:</span> {prompt.twist}</p>}
      {prompt.bonus && (
        <p>
          <span className="font-bold">Bonus word, if you can fit it in:</span> {prompt.bonus.word}{" "}
          <span className="text-muted">({prompt.bonus.meaning})</span>
        </p>
      )}
    </IndexCard>
  );

  const Draft = ({ r }: { r: number }) => (
    <div className="rounded border border-line bg-surface-raised p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-ink text-xs font-semibold text-paper">{r}</span>
        <span className="text-sm font-medium text-ink-soft">Writer {r}</span>
      </div>
      <div className="min-h-[9rem] whitespace-pre-wrap font-mono text-[0.9375rem] leading-7 text-ink">{drafts[r] || <span className="text-muted">…</span>}</div>
    </div>
  );

  return (
    <AppShell>
      <PageHeader title="The writing game" description="Six writers, three rounds. Each round, two of you get a fresh prompt and five minutes to write, and the other four vote for the piece they like best." />

      {rt.status === "checking" && <div className="h-40 animate-pulse rounded bg-surface-sunken" aria-hidden />}
      {rt.status === "disabled" && <RealtimeNotice feature="The writing game" />}

      {rt.status === "enabled" && (
        <div className="max-w-4xl space-y-4">
          {!joined && (
            <div className="border-t-2 border-ink pt-6">
              <h2 className="text-2xl font-semibold text-ink">Join the lobby</h2>
              <p className="mt-2 text-ink-soft">The game begins automatically once six writers are in.</p>
              <div className="mt-6 flex gap-2">
                <button onClick={join} className="btn-accent px-6">Join lobby</button>
                {resumeAvailable && <button onClick={join} className="btn-secondary px-5">Rejoin</button>}
              </div>
            </div>
          )}

          {joined && phase === "lobby" && (
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-lg font-semibold text-ink">Lobby</h2>
                <span className="font-mono tabular-nums text-ink-soft">{lobby.count} / 6</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {lobby.players.map((p, i) => <span key={i} className="tag">{p}</span>)}
                {Array.from({ length: Math.max(0, 6 - lobby.count) }).map((_, i) => (
                  <span key={`e${i}`} className="tag border-dashed text-muted">waiting…</span>
                ))}
              </div>
              <div className="mt-5 flex items-center gap-2">
                <button onClick={startNow} disabled={lobby.count < 6} className="btn-primary px-4">Start now</button>
                <button onClick={leave} className="btn-ghost px-4">Leave</button>
              </div>
            </div>
          )}

          {joined && phase === "writing" && (
            <div>
              <div className="flex flex-wrap items-center gap-3 border-b border-line pb-4">
                <span className="badge">{role ? `You’re Writer ${role}` : "Finding your seat…"}</span>
                <span className="text-sm text-ink-soft">This round: <span className="font-medium text-ink">{pair ? `Writer ${pair[0]} vs Writer ${pair[1]}` : "waiting…"}</span></span>
                <span role="timer" aria-label="Time left" className={`ml-auto rounded px-3 py-1 font-mono text-lg font-bold tabular-nums ${timeLeft <= 30 ? "bg-danger/10 text-danger" : "text-ink"}`}>{mmss}</span>
              </div>

              {promptBox}

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Draft r={pair?.[0] ?? 0} />
                <Draft r={pair?.[1] ?? 0} />
              </div>

              {canWrite ? (
                <div className="mt-4">
                  <p className="mb-2 text-sm font-medium text-ink">You’re writing this round</p>
                  <textarea aria-label="Your piece" className="field typescript min-h-[11rem]" value={myDraft} onChange={(e) => onType(e.target.value)} placeholder="Write your piece…" />
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted">You’re sitting this round out. Read along and get ready to vote.</p>
              )}
            </div>
          )}

          {joined && phase === "voting" && pair && (
            <div>
              <h2 className="border-b border-line pb-4 text-xl font-semibold text-ink">Vote: Writer {pair[0]} vs Writer {pair[1]}</h2>
              {promptBox}
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Draft r={pair[0]} />
                <Draft r={pair[1]} />
              </div>
              {role && !pair.includes(role) ? (
                <div className="mt-4 flex gap-2">
                  <button onClick={() => vote(pair[0])} className="btn-primary flex-1">Vote Writer {pair[0]}</button>
                  <button onClick={() => vote(pair[1])} className="btn-primary flex-1">Vote Writer {pair[1]}</button>
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted">Writers can’t vote in their own round.</p>
              )}
              <div className="mt-3 text-sm text-muted">Tally: {Object.entries(tally).map(([k, v]) => `${k}:${v}`).join("  ") || "no votes yet"}</div>
            </div>
          )}

          {joined && phase === "results" && (
            <div className="card-raised p-6">
              <h2 className="font-serif text-xl font-semibold text-ink">Results</h2>
              <div className="mt-4 divide-y divide-line border-y border-line">
                {[1, 2, 3, 4, 5, 6].sort((a, b) => (score[b] || 0) - (score[a] || 0)).map((r, i) => (
                  <div key={r} className="flex items-center gap-3 py-2.5">
                    <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-semibold ${i === 0 ? "bg-gold text-paper" : "bg-surface-sunken text-ink-soft"}`}>{i + 1}</span>
                    <span className="text-ink">Writer {r}</span>
                    <span className="ml-auto font-semibold tabular-nums text-ink">{score[r] || 0} pts</span>
                  </div>
                ))}
              </div>
              <button onClick={leave} className="btn-secondary mt-5 px-5">Leave</button>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
