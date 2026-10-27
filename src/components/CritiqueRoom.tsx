"use client";
import Link from "next/link";
import { readDraft } from "../../public/draft-storage.js";
import React, { useEffect, useState } from "react";
import { AppShell } from "@/components/shell";
import { PageHeader, Notice } from "@/components/ui";
import { useLiveRoom, useLiveClock } from "@/lib/live-client";
export default function CritiqueRoom({ long = false }: { long?: boolean }) {
  const { snapshot, connected, error, busy, act } = useLiveRoom(
    long ? "critique:long" : "critique:short",
  );
  const [title, setTitle] = useState("");
  const [piece, setPiece] = useState("");
  const [feedback, setFeedback] = useState("");
  const [message, setMessage] = useState("");
  const [hours, setHours] = useState(24);
  const [draftNote, setDraftNote] = useState("");
  const [library, setLibrary] = useState<
    { id: string; title: string; html: string }[]
  >([]);
  const now = useLiveClock(snapshot?.serverTime);
  const state = snapshot?.state?.kind === "pair" ? snapshot.state : null;
  const id = snapshot?.identity.id || "";
  const other = state?.players.find((p) => p.id !== id);
  const partnerPiece = other ? state?.pieces[other.id] : null;
  const submitted = !!state?.feedback[id];
  const left = !!state?.left.length;
  const remaining = state
    ? Math.max(0, Math.ceil((state.endsAt - now) / 1000))
    : 0;
  useEffect(() => {
    fetch("/api/library")
      .then((r) => (r.ok ? r.json() : { stories: [] }))
      .then((j) => setLibrary(j.stories || []))
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("draft") !== "1")
      return;
    try {
      const draft = readDraft(localStorage);
      setTitle(draft.title.slice(0, 200));
      setPiece(draft.html.slice(0, 100000));
      setDraftNote(
        draft.html.length > 100000
          ? "The first 100,000 characters were copied for this critique. Your complete private draft is unchanged."
          : "Copied from your private draft. Changes here won’t change the original.",
      );
    } catch {
      setDraftNote(
        "We couldn’t open your device draft. You can paste your piece below.",
      );
    }
  }, []);
  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (await act("message", { text: message })) setMessage("");
  }
  return (
    <AppShell>
      <PageHeader
        title="Exchange critiques"
        description={
          long
            ? "Exchange work and leave each other detailed notes."
            : "Pair up and spend ten minutes reading each other’s work."
        }
      />
      <nav
        aria-label="Critique format"
        className="critique-tabs mb-6 flex flex-wrap gap-2"
      >
        <Link
          href="/critique/short"
          className={long ? "btn-secondary" : "btn-primary"}
          aria-current={!long ? "page" : undefined}
        >
          Ten-minute exchange
        </Link>
        <Link
          href="/critique/long"
          className={long ? "btn-primary" : "btn-secondary"}
          aria-current={long ? "page" : undefined}
        >
          Longer read
        </Link>
      </nav>
      {error && <Notice tone="danger">{error}</Notice>}
      <p className="mb-4 text-sm text-muted">
        {connected
          ? `Joining as ${snapshot?.identity.name}`
          : "Connecting to the workshop…"}
      </p>
      {!state ? (
        <div className="critique-preparation grid gap-8 lg:grid-cols-[1fr_15rem]">
          <div className="card-raised min-w-0 p-6">
            <p>
              Add the piece you want critiqued. The timer starts when you’re
              paired.
            </p>
            {draftNote && (
              <p className="mt-3 text-sm text-accent" role="status">
                {draftNote}
              </p>
            )}
            <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_13rem]">
              <label className="label">
                Piece title
                <input
                  aria-label="Title"
                  className="field mt-2"
                  maxLength={200}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Title (optional)"
                />
              </label>
              <label className="label">
                Or use published work
                <select
                  aria-label="Pick from your library"
                  className="field mt-2"
                  defaultValue=""
                  onChange={(e) => {
                    const s = library.find((s) => s.id === e.target.value);
                    if (s) {
                      setTitle(s.title);
                      setPiece(s.html);
                    }
                  }}
                >
                  <option value="">Pick from library…</option>
                  {library.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="label mt-5" htmlFor="critique-piece">
              Your piece
            </label>
            <textarea
              id="critique-piece"
              aria-label="Your piece"
              maxLength={100000}
              className="field typescript mt-2 min-h-64"
              value={piece}
              onChange={(e) => setPiece(e.target.value)}
              placeholder="Paste your piece…"
            />
            {long && (
              <label className="mt-3 block text-sm">
                Hours to review
                <select
                  className="field mt-2"
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                >
                  {[1, 6, 12, 24, 48, 72].map((h) => (
                    <option key={h} value={h}>
                      {h} hours
                    </option>
                  ))}
                </select>
              </label>
            )}
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                disabled={
                  !connected || busy || !piece.trim() || snapshot?.waiting
                }
                onClick={() =>
                  act("join", { title, text: piece, hours, seconds: 600 })
                }
                className="btn-accent"
              >
                {snapshot?.waiting ? "Finding a partner…" : "Find a partner"}
              </button>
              {snapshot?.waiting && (
                <button className="btn-secondary" onClick={() => act("cancel")}>
                  Cancel search
                </button>
              )}
            </div>
            {snapshot?.waiting && (
              <p role="status" className="mt-4 text-sm text-muted">
                Your piece is ready. Keep this page open while another writer
                joins this format. You can cancel at any time.
              </p>
            )}
          </div>
          <aside className="pt-1">
            <h2 className="text-xl">Be the reader you’d want.</h2>
            <div className="mt-5 space-y-5 text-sm leading-7 text-ink-soft">
              <p>
                <strong className="text-ink">
                  Notice what stays with you.
                </strong>
                <br />A line, an image, a moment that feels true. Tell the
                writer why.
              </p>
              <p>
                <strong className="text-ink">
                  Be specific about the friction.
                </strong>
                <br />
                Where did you lose the thread? A question is often more useful
                than a verdict.
              </p>
              <p>
                <strong className="text-ink">
                  Leave room for their voice.
                </strong>
                <br />
                Help the piece become itself.
              </p>
            </div>
            <p className="mt-6 border-t border-line pt-5 text-xs leading-6 text-muted">
              Your piece is shared with your matched partner. It is not
              published to the reading room.
            </p>
          </aside>
        </div>
      ) : (
        <div className="max-w-5xl space-y-4">
          <div className="flex flex-wrap items-center gap-3 border-y border-line py-3">
            <strong>Paired with {other?.name}</strong>
            <span
              role="timer"
              aria-label="Time left"
              className="ml-auto font-mono"
            >
              {long
                ? `${Math.floor(remaining / 3600)}h ${Math.floor((remaining % 3600) / 60)}m`
                : `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`}
            </span>
            <button onClick={() => act("leave")} className="btn-ghost">
              Leave
            </button>
          </div>
          {left && <Notice tone="info">Your partner left this session.</Notice>}
          {state.endedReason && (
            <Notice tone="info">
              {state.endedReason === "time_up"
                ? "Time is up. Your saved feedback is available below."
                : "Both critiques are submitted. You can read your partner’s feedback below."}
            </Notice>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { label: "Your piece", data: state.pieces[id] },
              { label: "Partner’s piece", data: partnerPiece },
            ].map((p) => (
              <div key={p.label} className="card p-5">
                <h2 className="font-semibold">
                  {p.label}
                  {p.data?.title ? `: ${p.data.title}` : ""}
                </h2>
                <p className="mt-3 max-h-80 overflow-y-auto whitespace-pre-wrap break-words font-mono">
                  {p.data?.text}
                </p>
              </div>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="card p-5">
              <h2 className="font-semibold">Your critique</h2>
              {submitted ? (
                <p className="mt-3 whitespace-pre-wrap">{state.feedback[id]}</p>
              ) : (
                <>
                  <textarea
                    aria-label="Your critique"
                    className="field mt-3 min-h-44"
                    maxLength={20000}
                    disabled={!!state.endedReason || left}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="What worked? What could improve?"
                  />
                  <button
                    className="btn-primary mt-3"
                    disabled={
                      busy || !!state.endedReason || left || !feedback.trim()
                    }
                    onClick={() => act("submit", { text: feedback })}
                  >
                    Submit critique
                  </button>
                </>
              )}
            </div>
            <div className="card p-5">
              <h2 className="font-semibold">Your partner’s feedback</h2>
              <p className="mt-3 whitespace-pre-wrap break-words">
                {(other && state.feedback[other.id]) ||
                  "Waiting for your partner’s notes…"}
              </p>
            </div>
          </div>
          <div className="card p-5">
            <h2 className="font-semibold">Live chat</h2>
            {!state.chatLive ? (
              <div className="mt-3">
                {state.chatRequestedBy && state.chatRequestedBy !== id ? (
                  <>
                    <p>Your partner wants to chat.</p>
                    <button
                      className="btn-primary mt-3"
                      disabled={busy || left}
                      onClick={() => act("accept-chat")}
                    >
                      Accept
                    </button>
                    <button
                      className="btn-secondary ml-3"
                      onClick={() => act("decline-chat")}
                    >
                      Decline
                    </button>
                  </>
                ) : (
                  <button
                    className="btn-secondary"
                    disabled={busy || left || state.chatRequestedBy === id}
                    onClick={() => act("request-chat")}
                  >
                    {state.chatRequestedBy === id
                      ? "Waiting for your partner…"
                      : "Request live chat"}
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="mt-3 max-h-60 overflow-y-auto space-y-2 rounded border border-line p-3">
                  {snapshot?.messages.map((m) => (
                    <div key={m.id} className="text-sm">
                      <strong>{m.fromId === id ? "You" : m.from}:</strong>{" "}
                      <span className="whitespace-pre-wrap break-words">
                        {m.text}
                      </span>
                    </div>
                  ))}
                </div>
                <form onSubmit={send} className="mt-3 flex gap-3">
                  <input
                    aria-label="Message"
                    className="field flex-1"
                    maxLength={2000}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                  <button
                    disabled={busy || left || !message.trim()}
                    className="btn-primary"
                  >
                    Send
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
