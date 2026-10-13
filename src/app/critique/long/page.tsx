"use client";

import React, { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { AppShell } from "@/components/shell";
import { Icon, PageHeader, Notice } from "@/components/ui";
import RealtimeNotice from "@/components/RealtimeNotice";
import { useRealtime } from "@/lib/realtime";

type PickerStory = { id: string; title: string; html: string };
type ChatMsg = { from: string; text: string; at: number };
const STORE_KEY = "critique:long:session";

export default function LongCritiquePage() {
  const rt = useRealtime();
  const socketRef = useRef<Socket | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [partnerName, setPartnerName] = useState<string | null>(null);
  const [room, setRoom] = useState<string | null>(null);
  const [hours, setHours] = useState(24);
  const [endAt, setEndAt] = useState<string | null>(null);
  const [endedReason, setEndedReason] = useState<string | null>(null);

  const [myTitle, setMyTitle] = useState("");
  const [myText, setMyText] = useState("");
  const [partnerPiece, setPartnerPiece] = useState<{ title?: string; text?: string } | null>(null);
  const [library, setLibrary] = useState<PickerStory[]>([]);

  const [critique, setCritique] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [partnerSubmitted, setPartnerSubmitted] = useState(false);

  const [incomingChatFrom, setIncomingChatFrom] = useState<string | null>(null);
  const [chatRequested, setChatRequested] = useState(false);
  const [chatLive, setChatLive] = useState(false);

  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [chatText, setChatText] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const st = JSON.parse(raw);
        setPartnerName(st.partnerName || null); setRoom(st.room || null); setHours(st.hours || 24);
        setEndAt(st.endAt || null); setPartnerPiece(st.partnerPiece || null); setMyTitle(st.myTitle || ""); setMyText(st.myText || "");
        setChatLive(Boolean(st.chatLive)); setSubmitted(Boolean(st.submitted)); setPartnerSubmitted(Boolean(st.partnerSubmitted)); setEndedReason(st.endedReason || null);
      }
    } catch {}
  }, []);
  function persist(partial: any) {
    try {
      const curr = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
      localStorage.setItem(STORE_KEY, JSON.stringify({ ...curr, ...partial, myTitle, myText, hours, chatLive, submitted, partnerSubmitted, endAt, room, partnerName, endedReason }));
    } catch {}
  }

  useEffect(() => {
    if (rt.status !== "enabled") return;
    const s = io(rt.url || undefined); socketRef.current = s;

    s.on("mm:waiting", () => setWaiting(true));
    s.on("mm:paired:long", (p: any) => {
      setWaiting(false); setPartnerName(p.partnerName); setRoom(p.room); setEndAt(p.endAt); setPartnerPiece(p.partnerPiece || null);
      s.emit("join", { room: p.room, name: "You" });
      persist({ room: p.room, partnerName: p.partnerName, endAt: p.endAt, partnerPiece: p.partnerPiece || null });
    });
    s.on("mm:partner-left", () => setChat((c) => c.concat({ from: "system", text: "Your partner left.", at: Date.now() })));
    s.on("crit:submitted", ({ fromId, fromName }: any) => {
      if (s.id === fromId) { setSubmitted(true); persist({ submitted: true }); }
      else { setPartnerSubmitted(true); persist({ partnerSubmitted: true }); }
      setChat((c) => c.concat({ from: fromName || "Partner", text: "[submitted critique]", at: Date.now() }));
    });
    s.on("crit:partner-submitted", ({ fromName }: any) => { setPartnerSubmitted(true); persist({ partnerSubmitted: true }); setChat((c) => c.concat({ from: fromName || "Partner", text: "[submitted critique]", at: Date.now() })); });
    s.on("crit:ended", ({ reason }: any) => { setEndedReason(reason || "ended"); persist({ endedReason: reason || "ended" }); });
    s.on("crit:chat:request", ({ fromName, fromId }: any) => { if (fromId !== s.id) setIncomingChatFrom(fromName || "Partner"); });
    s.on("crit:chat:started", () => { setIncomingChatFrom(null); setChatRequested(false); setChatLive(true); persist({ chatLive: true }); });
    s.on("chat:message", (m: any) => setChat((c) => c.concat({ from: m.from, text: m.text, at: m.at })));

    if (room) s.emit("join", { room, name: "You" });
    return () => { s.close(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room, rt.status, rt.url]);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/library", { credentials: "include" });
        const j = await r.json().catch(() => ({}));
        setLibrary((j?.stories || []).map((s: any) => ({ id: s.id, title: s.title, html: s.html })));
      } catch {}
    })();
  }, []);

  function pickFromLibrary(s: PickerStory) { setMyTitle(s.title); setMyText(s.html || ""); persist({}); }
  function startMatchmaking() {
    if (!myText.trim()) { alert("Please add your piece (paste or pick from Library) before starting."); return; }
    setWaiting(true);
    socketRef.current?.emit("mm:join", { mode: "critique:long", payload: { hours, piece: { title: myTitle, text: myText } } });
    persist({});
  }
  function leave() {
    if (room) socketRef.current?.emit("mm:leave", { mode: "critique:long", room });
    setWaiting(false); setPartnerName(null); setRoom(null); setPartnerPiece(null); setEndAt(null);
    setChatRequested(false); setChatLive(false); setSubmitted(false); setPartnerSubmitted(false); setEndedReason(null);
    try { localStorage.removeItem(STORE_KEY); } catch {}
  }
  function submitCritique() {
    if (!room || !critique.trim() || submitted || endedReason) return;
    setSubmitted(true); persist({ submitted: true });
    socketRef.current?.emit("crit:submit", { room, text: critique });
    setCritique("");
  }
  function requestChat() { if (room && !chatLive) { setChatRequested(true); socketRef.current?.emit("crit:chat:request", { room }); } }
  function acceptChat() { if (room) socketRef.current?.emit("crit:chat:accept", { room }); }
  function sendChat() { if (!room || !chatLive || !chatText.trim()) return; socketRef.current?.emit("chat:message", { room, text: chatText }); setChatText(""); }

  const endedBanner = endedReason ? (endedReason === "time_up" ? "Time is up. Session ended." : "Both critiques submitted. Session ended.") : null;

  return (
    <AppShell>
      <PageHeader title="Slow critique" description="Swap pieces with another writer and take your time with it. You choose how long the exchange stays open." />

      {rt.status === "checking" && <div className="h-40 animate-pulse rounded bg-surface-sunken" aria-hidden />}
      {rt.status === "disabled" && <RealtimeNotice feature="Slow critique" />}

      {rt.status === "enabled" && !room && (
        <div className="max-w-3xl">
          <div className="card-raised p-6">
            <p className="text-ink-soft">Add the piece you want critiqued, choose a window, and we’ll pair you with another writer.</p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <input aria-label="Title" className="field sm:flex-1" placeholder="Title (optional)" value={myTitle} onChange={(e) => { setMyTitle(e.target.value); persist({}); }} />
              <select aria-label="Pick from your library" className="field sm:w-52" onChange={(e) => { const s = library.find((x) => x.id === e.target.value); if (s) pickFromLibrary(s); }} defaultValue="">
                <option value="">Pick from library…</option>
                {library.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
              </select>
              <label className="flex items-center gap-2 text-sm text-muted">
                <input aria-label="Hours to keep the exchange open" className="field w-20" type="number" min={1} max={72} value={hours} onChange={(e) => { setHours(Number(e.target.value || 24)); persist({}); }} /> hrs
              </label>
            </div>
            <textarea aria-label="Your piece" className="field typescript mt-3 min-h-[16rem]" placeholder="Paste your piece…" value={myText} onChange={(e) => { setMyText(e.target.value); persist({}); }} />
            <button onClick={startMatchmaking} disabled={waiting} className="btn-accent mt-4 px-6 py-2.5">{waiting ? "Finding a partner…" : "Find a partner"}</button>
          </div>
        </div>
      )}

      {rt.status === "enabled" && room && (
        <div className="space-y-4">
          {incomingChatFrom && !chatLive && (
            <div className="flex flex-wrap items-center gap-3 rounded border border-accent/25 bg-accent-soft px-4 py-3 text-sm">
              <span className="text-ink"><span className="font-semibold">{incomingChatFrom}</span> wants to start a live chat.</span>
              <button onClick={acceptChat} className="btn-primary px-4">Accept</button>
              <button onClick={() => setIncomingChatFrom(null)} className="btn-secondary px-4">Decline</button>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 border-y border-line py-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-ink font-semibold text-paper">{(partnerName ?? "P")[0]?.toUpperCase()}</span>
            <div className="text-sm">Paired with <span className="font-semibold text-ink">{partnerName ?? "Partner"}</span></div>
            <div className="ml-auto text-[0.9375rem] text-ink-soft">{endAt ? `Due ${new Date(endAt).toLocaleString()}` : "No due date yet"}</div>
            <button onClick={leave} className="btn-ghost px-3">Leave</button>
          </div>

          {endedBanner && <Notice tone="info">{endedBanner}</Notice>}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="card p-5">
              <h3 className="font-serif text-base font-semibold text-ink">Your piece{myTitle ? `: ${myTitle}` : ""}</h3>
              <div className="mt-3 max-h-72 overflow-y-auto whitespace-pre-wrap font-mono text-[0.9375rem] leading-7 text-ink">{myText}</div>
            </div>
            <div className="card p-5">
              <h3 className="font-serif text-base font-semibold text-ink">Partner’s piece{partnerPiece?.title ? `: ${partnerPiece.title}` : ""}</h3>
              <div className="mt-3 max-h-72 overflow-y-auto whitespace-pre-wrap font-mono text-[0.9375rem] leading-7 text-ink">{partnerPiece?.text || "Waiting…"}</div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className={`card p-5 ${submitted || endedReason ? "opacity-60" : ""}`}>
              <h3 className="font-serif text-base font-semibold text-ink">Write your critique</h3>
              <textarea aria-label="Your critique" className="field mt-3 min-h-[11rem] leading-7" value={critique} onChange={(e) => setCritique(e.target.value)} placeholder="What worked for you? What didn’t? Point to specific lines if you can…" disabled={submitted || !!endedReason} />
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={submitCritique} disabled={submitted || !!endedReason} className="btn-primary px-4">{submitted ? <><Icon name="check" /> Submitted</> : "Submit critique"}</button>
                {!chatLive && <button onClick={requestChat} disabled={chatRequested || !!endedReason} className="btn-secondary px-4">{chatRequested ? "Waiting…" : "Request live chat"}</button>}
              </div>
              {partnerSubmitted && !endedReason && <p className="mt-2 text-sm text-success">Partner submitted their critique.</p>}
            </div>

            <div className="card p-5">
              <h3 className="font-serif text-base font-semibold text-ink">Live chat</h3>
              {!chatLive ? (
                <p className="mt-3 text-sm text-muted">Chat opens here once both of you accept.</p>
              ) : (
                <>
                  <div className="mt-3 h-44 space-y-1.5 overflow-y-auto rounded border border-line bg-surface-sunken p-3">
                    {chat.map((m, i) => <div key={i} className="text-sm"><span className="font-medium text-ink">{m.from}:</span> <span className="text-ink-soft">{m.text}</span></div>)}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <input aria-label="Message" className="field flex-1" value={chatText} onChange={(e) => setChatText(e.target.value)} placeholder="Type…" />
                    <button onClick={sendChat} className="btn-primary px-4">Send</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
