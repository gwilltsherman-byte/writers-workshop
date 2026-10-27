"use client";
import React, { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/shell";
import { PageHeader, Notice } from "@/components/ui";
import { IndexCard } from "@/components/IndexCard";
import { useLiveRoom, useLiveClock } from "@/lib/live-client";
export default function GamePage() {
  const { snapshot, connected, error, busy, act } = useLiveRoom("game");
  const [draft, setDraft] = useState("");
  const [share, setShare] = useState("");
  const now = useLiveClock(snapshot?.serverTime);
  const restoredRound = useRef("");
  const g = snapshot?.state?.kind === "game" ? snapshot.state : null;
  const me = g?.players.find((p) => p.id === snapshot?.identity.id);
  const writing =
    !!me &&
    g?.phase === "writing" &&
    !!g.pair?.includes(me.role) &&
    !g.submitted.includes(me.id);
  const canVote =
    !!me &&
    g?.phase === "voting" &&
    (g.players.length === 2 || !g.pair?.includes(me.role)) &&
    g.votes[me.id] === undefined;
  const left = g?.endsAt ? Math.max(0, Math.ceil((g.endsAt - now) / 1000)) : 0;
  useEffect(() => {
    const key = `${snapshot?.room}:${g?.phase}:${g?.roundIndex}:${me?.role}`;
    if (restoredRound.current !== key) {
      restoredRound.current = key;
      setDraft(g?.drafts[me?.role || 0] || "");
    }
  }, [g, me?.role, snapshot?.room]);
  useEffect(() => {
    if (!writing) return;
    const t = setTimeout(() => {
      void act("draft", { text: draft });
    }, 700);
    return () => clearTimeout(t);
  }, [draft, writing, act]);
  async function invite() {
    const s = await act("create");
    if (s?.room)
      setShare(`${location.origin}/game6?room=${encodeURIComponent(s.room)}`);
  }
  const names = (role: number) =>
    g?.players.find((p) => p.role === role)?.name || `Writer ${role}`;
  const piece = (r: number) => (
    <div key={r} className="card min-w-0 p-5">
      <h3 className="font-semibold">{names(r)}</h3>
      <p className="mt-3 min-h-36 whitespace-pre-wrap break-words font-serif leading-relaxed">
        {g?.drafts[r] || "Waiting for a piece…"}
      </p>
    </div>
  );
  return (
    <AppShell>
      <PageHeader
        title="The writing game"
        description="Two to six writers, three prompts. Write, compare your pieces, and vote together."
      />
      {error && <Notice tone="danger">{error}</Notice>}
      <p role="status" className="mb-4 text-sm text-muted">
        {connected
          ? `Playing as ${snapshot?.identity.name}`
          : "Connecting to the workshop…"}
      </p>
      {!g ? (
        <div className="max-w-3xl border-t-2 border-ink pt-6">
          <h2 className="text-2xl font-semibold">Find a game</h2>
          <p className="mt-2 text-ink-soft">
            Join other writers, or create a room and share its link with
            friends.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => act("join")}
              disabled={!connected || busy}
              className="btn-accent"
            >
              Join lobby
            </button>
            <button
              onClick={invite}
              disabled={!connected || busy}
              className="btn-secondary"
            >
              Create a room
            </button>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl space-y-4">
          <div className="flex flex-wrap items-center gap-3 border-y border-line py-3">
            <span className="badge">
              {me?.role ? `You’re Writer ${me.role}` : "Lobby"}
            </span>
            <span className="text-sm text-muted">
              {g.players.filter((p) => !p.left).length}{" "}
              {g.players.filter((p) => !p.left).length === 1
                ? "writer"
                : "writers"}
            </span>
            {g.endsAt && (
              <span
                role="timer"
                aria-label="Time left"
                className="ml-auto font-mono text-lg font-bold"
              >
                {String(Math.floor(left / 60)).padStart(2, "0")}:
                {String(left % 60).padStart(2, "0")}
              </span>
            )}
            <button
              disabled={!connected || busy}
              className="btn-ghost ml-auto"
              onClick={() => act("leave")}
            >
              Leave
            </button>
          </div>
          {g.phase === "lobby" && (
            <div className="card p-6">
              <h2 className="text-xl font-semibold">
                Lobby · {g.players.length} / 6
              </h2>
              <div className="my-4 flex flex-wrap gap-2">
                {g.players.map((p) => (
                  <span key={p.id} className="tag">
                    {p.name}
                  </span>
                ))}
              </div>
              <p className="text-sm text-muted">
                Start with at least two writers. A public lobby starts
                automatically at six. With two players, both of you vote; tied
                votes give each writer a point.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  disabled={!connected || busy || g.players.length < 2}
                  onClick={() => act("start")}
                  className="btn-primary"
                >
                  Start now
                </button>
                <button
                  onClick={() =>
                    setShare(
                      `${location.origin}/game6?room=${encodeURIComponent(snapshot!.room!)}`,
                    )
                  }
                  className="btn-secondary"
                >
                  Share game link
                </button>
              </div>
              {share && (
                <div className="mt-4">
                  <label className="text-sm" htmlFor="game-invite">
                    Send this link to your friends
                  </label>
                  <input
                    id="game-invite"
                    readOnly
                    value={share}
                    onFocus={(e) => e.target.select()}
                    className="field mt-2"
                  />
                </div>
              )}
            </div>
          )}
          {(g.phase === "writing" || g.phase === "voting") && (
            <>
              <IndexCard
                label={`Round ${g.roundIndex + 1} of 3`}
                cardKey={g.roundIndex}
              >
                <p>{g.prompt?.text}</p>
                {g.prompt?.twist && (
                  <p>
                    <strong>The catch:</strong> {g.prompt.twist}
                  </p>
                )}
              </IndexCard>
              <div className="grid gap-4 md:grid-cols-2">
                {g.pair?.map(piece)}
              </div>
              {g.phase === "writing" &&
                (writing ? (
                  <div>
                    <label className="font-semibold" htmlFor="game-piece">
                      Your piece
                    </label>
                    <textarea
                      id="game-piece"
                      className="field typescript mt-2 min-h-44"
                      value={draft}
                      maxLength={10000}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder="Write your piece…"
                    />
                    <div className="mt-3 flex flex-wrap gap-3">
                      <button
                        disabled={!connected || busy || !draft.trim()}
                        onClick={() => act("submit", { text: draft })}
                        className="btn-primary"
                      >
                        Submit piece
                      </button>
                      <button
                        disabled={!connected || busy}
                        onClick={() => act("draft", { text: draft })}
                        className="btn-secondary"
                      >
                        Save draft
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-muted">
                      Your draft saves as you write. Voting begins when both
                      writers submit, or when the timer runs out.
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted">
                    {me && g.submitted.includes(me.id)
                      ? "Your piece is submitted. Waiting for the other writer."
                      : "Read along. You’ll vote when both pieces are ready."}
                  </p>
                ))}
              {g.phase === "voting" &&
                (canVote ? (
                  <div className="flex flex-wrap gap-3">
                    {g.pair?.map((r) => (
                      <button
                        key={r}
                        disabled={!connected || busy}
                        onClick={() =>
                          act("vote", { role: r, roundIndex: g.roundIndex })
                        }
                        className="btn-primary"
                      >
                        Vote for {names(r)}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted">
                    {me && g.votes[me.id] !== undefined
                      ? "Your vote is saved. Waiting for the remaining votes."
                      : "The other writers are voting this round."}
                  </p>
                ))}
            </>
          )}
          {g.phase === "results" && (
            <div className="card-raised p-6">
              <h2 className="text-2xl font-semibold">Results</h2>
              <div className="my-5 divide-y divide-line">
                {[...g.players]
                  .sort(
                    (a, b) => (g.score[b.role] || 0) - (g.score[a.role] || 0),
                  )
                  .map((p) => (
                    <div
                      key={p.id}
                      className="flex items-baseline justify-between gap-4 py-3"
                    >
                      <span className="min-w-0 break-words">{p.name}</span>
                      <strong className="shrink-0">
                        {g.score[p.role] || 0} pts
                      </strong>
                    </div>
                  ))}
              </div>
              <button
                disabled={!connected || busy}
                onClick={() => act("start")}
                className="btn-primary"
              >
                Play again
              </button>
              {g.roundResults.map((r, i) => (
                <details key={i} className="mt-4 border-t border-line pt-3">
                  <summary>
                    Round {i + 1} ·{" "}
                    {r.winners.length === 2
                      ? "Draw"
                      : r.winners.length
                        ? `${names(r.winners[0])} won`
                        : "No votes"}
                  </summary>
                  <div className="mt-3 grid gap-4 md:grid-cols-2">
                    {r.pair.map((role) => (
                      <div key={role}>
                        <strong>{names(role)}</strong>
                        <p className="mt-2 whitespace-pre-wrap break-words">
                          {r.drafts[role] || "No piece submitted."}
                        </p>
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
