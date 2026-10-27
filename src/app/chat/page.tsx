"use client";
import React, { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/shell";
import { PageHeader, Notice } from "@/components/ui";
import { useLiveRoom } from "@/lib/live-client";
export default function ChatPage() {
  const { snapshot, connected, error, busy, act } = useLiveRoom("chat:live");
  const [text, setText] = useState("");
  const scroll = useRef<HTMLDivElement>(null);
  const state = snapshot?.state?.kind === "pair" ? snapshot.state : null;
  const partner = state?.players.find((p) => p.id !== snapshot?.identity.id);
  const left = !!state?.left.length;
  useEffect(() => {
    scroll.current?.scrollTo({
      top: scroll.current.scrollHeight,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }, [snapshot?.messages.length]);
  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    if (await act("message", { text })) setText("");
  }
  return (
    <AppShell>
      <PageHeader
        title="Live writing chat"
        description="Meet another writer for a one-on-one conversation."
      />
      {error && <Notice tone="danger">{error}</Notice>}
      <p role="status" className="mb-4 text-sm text-muted">
        {connected
          ? `Chatting as ${snapshot?.identity.name}`
          : "Connecting to the workshop…"}
      </p>
      {!state ? (
        <div className="max-w-3xl border-t-2 border-ink pt-6">
          <h2 className="text-2xl font-semibold">Start a chat</h2>
          <p className="mt-2 text-ink-soft">
            {snapshot?.waiting
              ? "You’re in the queue. Keep this page open; your conversation will appear when another writer joins."
              : "We’ll pair you with the next available writer. You can join as a guest."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              disabled={!connected || busy || snapshot?.waiting}
              onClick={() => act("join")}
              className="btn-accent px-6"
            >
              {snapshot?.waiting ? "Finding a partner…" : "Find a partner"}
            </button>
            {snapshot?.waiting && (
              <button
                disabled={busy}
                onClick={() => act("cancel")}
                className="btn-secondary"
              >
                Cancel search
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="card-raised max-w-3xl overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-3.5">
            <strong className="min-w-0 break-words">{partner?.name}</strong>
            <span className="ml-auto text-sm text-muted">
              {left
                ? "Partner left"
                : connected &&
                    partner &&
                    partner.seenAt > snapshot!.serverTime - 45000
                  ? "Connected"
                  : "Reconnecting…"}
            </span>
            <button
              disabled={busy}
              onClick={() => act("leave")}
              className="btn-ghost"
            >
              Leave
            </button>
          </div>
          <div
            ref={scroll}
            role="log"
            aria-label="Conversation"
            aria-live="polite"
            aria-relevant="additions"
            tabIndex={0}
            className="h-[52vh] space-y-2.5 overflow-y-auto px-5 py-4"
          >
            {!snapshot?.messages.length && (
              <p className="text-sm text-muted">No messages yet. Say hi!</p>
            )}
            {snapshot?.messages.map((m) => {
              const mine = m.fromId === snapshot.identity.id;
              return (
                <div
                  key={m.id}
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded px-3.5 py-2 ${mine ? "bg-ink text-paper" : "border border-line bg-surface-sunken"}`}
                  >
                    <div className="text-xs opacity-70">
                      {mine ? "You" : m.from}
                    </div>
                    <p className="whitespace-pre-wrap break-words">{m.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
          {left ? (
            <p className="border-t border-line p-4 text-sm text-muted">
              Your partner left. Leave this room to find someone else.
            </p>
          ) : (
            <form
              onSubmit={send}
              className="flex gap-2 border-t border-line p-3"
            >
              <input
                aria-label="Message"
                className="field min-w-0 flex-1"
                value={text}
                maxLength={2000}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type a message…"
              />
              <button
                disabled={!connected || busy || !text.trim()}
                className="btn-primary px-5"
              >
                {busy ? "Sending…" : "Send"}
              </button>
            </form>
          )}
        </div>
      )}
    </AppShell>
  );
}
