"use client";

import React, { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { AppShell } from "@/components/shell";
import { PageHeader } from "@/components/ui";
import RealtimeNotice from "@/components/RealtimeNotice";
import { useRealtime } from "@/lib/realtime";

type Msg = { id?: string; from: string; text: string; at: number };
const CHAT_KEY = "session:chat";

export default function ChatPage() {
  const rt = useRealtime();
  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [room, setRoom] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [partnerName, setPartnerName] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CHAT_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s?.room) { setRoom(s.room); setPartnerName(s.partnerName || null); }
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (rt.status !== "enabled") return;
    const s = io(rt.url || undefined);
    socketRef.current = s;

    s.on("mm:waiting", () => setWaiting(true));
    s.on("mm:paired:chat", (p: { room: string; partnerName: string }) => {
      setWaiting(false);
      setPartnerName(p.partnerName);
      setRoom(p.room);
      try { localStorage.setItem(CHAT_KEY, JSON.stringify(p)); } catch {}
      s.emit("join", { room: p.room, name: "You" });
      loadHistory(p.room);
    });
    s.on("mm:partner-left", () => setMsgs((m) => m.concat({ from: "system", text: "Your partner left.", at: Date.now() })));
    s.on("chat:message", (m: Msg) => setMsgs((x) => x.concat(m)));

    if (room) { s.emit("join", { room, name: "You" }); loadHistory(room); }
    return () => { s.close(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room, rt.status, rt.url]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs]);

  async function loadHistory(r: string) {
    try {
      const res = await fetch(`/api/history/${encodeURIComponent(r)}`, { credentials: "include" });
      const j = await res.json().catch(() => []);
      setMsgs(Array.isArray(j) ? j : []);
    } catch {}
  }

  function start() { setWaiting(true); socketRef.current?.emit("mm:join", { mode: "chat:live", payload: {} }); }
  function leave() {
    if (room) socketRef.current?.emit("mm:leave", { mode: "chat:live", room });
    setRoom(null); setPartnerName(null); setMsgs([]);
    try { localStorage.removeItem(CHAT_KEY); } catch {}
  }
  function send() {
    if (!room || !text.trim()) return;
    socketRef.current?.emit("chat:message", { room, text });
    setText("");
  }
  function key(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  return (
    <AppShell>
      <PageHeader title="Live writing chat" description="Get matched with another writer for a one-on-one conversation." />

      {rt.status === "checking" && <div className="h-40 animate-pulse rounded bg-surface-sunken" aria-hidden />}
      {rt.status === "disabled" && <RealtimeNotice feature="Live chat" />}

      {rt.status === "enabled" && (
        <div className="max-w-3xl">
          {!room ? (
            <div className="border-t-2 border-ink pt-6">
              <h2 className="text-2xl font-semibold text-ink">Start a chat</h2>
              <p className="mt-2 text-ink-soft">We’ll pair you with the next available writer.</p>
              <button onClick={start} disabled={waiting} className="btn-accent mt-6 px-6">
                {waiting ? "Finding a partner…" : "Find a partner"}
              </button>
            </div>
          ) : (
            <div className="card-raised overflow-hidden">
              <div className="flex items-center gap-3 border-b border-line px-5 py-3.5">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-ink font-semibold text-paper">
                  {(partnerName ?? "P")[0]?.toUpperCase()}
                </span>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-ink">{partnerName ?? "Partner"}</div>
                  <div className="flex items-center gap-1.5 text-xs text-success"><span className="h-1.5 w-1.5 rounded-full bg-success" /> Connected</div>
                </div>
                <button onClick={leave} className="btn-ghost px-3">Leave</button>
              </div>

              <div ref={scrollRef} className="h-[52vh] space-y-2.5 overflow-y-auto px-5 py-4">
                {msgs.length === 0 ? (
                  <div className="grid h-full place-items-center text-sm text-muted">No messages yet. Say hi!</div>
                ) : (
                  msgs.map((m, i) => {
                    const mine = m.from === "You";
                    const system = m.from === "system";
                    if (system) return <div key={i} className="text-center text-xs text-muted">{m.text}</div>;
                    return (
                      <div key={i} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] rounded px-3.5 py-2 text-[0.9375rem] leading-6 ${mine ? "bg-ink text-paper" : "border border-line bg-surface-sunken text-ink"}`}>
                          {!mine && <div className="mb-0.5 text-xs font-medium text-muted">{m.from}</div>}
                          {m.text}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="flex gap-2 border-t border-line p-3">
                <input aria-label="Message" className="field flex-1" value={text} onKeyDown={key} onChange={(e) => setText(e.target.value)} placeholder="Type a message…" />
                <button onClick={send} className="btn-primary px-5">Send</button>
              </div>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
