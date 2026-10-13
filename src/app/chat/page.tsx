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
      behavior: "smooth",
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
      <p className="mb-4 text-sm text-muted">
        {connected
          ? `Playing as ${snapshot?.identity.name}`
          : "Connecting to the workshop…"}
      </p>
      {!state ? (
        <div className="max-w-3xl border-t-2 border-ink pt-6">
          <h2 className="text-2xl font-semibold">Start a chat</h2>
          <p className="mt-2 text-ink-soft">
            We’ll pair you with the next available writer.
          </p>
          <div className="mt-6 flex gap-3">
            <button
              disabled={!connected || busy || snapshot?.waiting}
              onClick={() => act("join")}
              className="btn-accent px-6"
            >
              {snapshot?.waiting ? "Finding a partner…" : "Find a partner"}
            </button>
            {snapshot?.waiting && (
              <button onClick={() => act("cancel")} className="btn-secondary">
                Cancel search
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="card-raised max-w-3xl overflow-hidden">
          <div className="flex items-center gap-3 border-b border-line px-5 py-3.5">
            <strong>{partner?.name}</strong>
            <span className="ml-auto text-sm text-muted">
              {left
                ? "Partner left"
                : connected &&
                    partner &&
                    partner.seenAt > snapshot!.serverTime - 45000
                  ? "Connected"
                  : "Reconnecting…"}
            </span>
            <button onClick={() => act("leave")} className="btn-ghost">
              Leave
            </button>
          </div>
          <div
            ref={scroll}
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
                className="field flex-1"
                value={text}
                maxLength={2000}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type a message…"
              />
              <button
                disabled={!connected || busy || !text.trim()}
                className="btn-primary px-5"
              >
                Send
              </button>
            </form>
          )}
        </div>
      )}
    </AppShell>
  );
}
