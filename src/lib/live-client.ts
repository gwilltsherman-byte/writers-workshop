"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/auth";
import type { Mode, LiveSnapshot } from "./live-types";

export async function liveSession() {
  const token = sessionStorage.getItem("ww-live-token");
  const r = await fetch("/api/realtime/session", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  if (!r.ok)
    throw new Error("Could not open a player session. Please try again.");
  const session = (await r.json()) as {
    token: string;
    id: string;
    name: string;
  };
  sessionStorage.setItem("ww-live-token", session.token);
  return session;
}
export function useLiveRoom(mode: Mode) {
  const { me, hydrated } = useAuth();
  const [snapshot, setSnapshot] = useState<LiveSnapshot | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const room = useRef<string | null>(null);
  const token = useRef("");
  const latest = useRef(0);
  const alive = useRef(false);
  const actionBusy = useRef(false);
  const request = useCallback(
    async (action = "poll", payload: Record<string, unknown> = {}) => {
      const res = await fetch("/api/live", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token.current}`,
        },
        body: JSON.stringify({ mode, room: room.current, action, payload }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Could not reach the live server.");
      if (alive.current && data.serverTime >= latest.current) {
        latest.current = data.serverTime;
        room.current = data.room;
        setSnapshot(data);
        setConnected(true);
      }
      return data as LiveSnapshot;
    },
    [mode],
  );
  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    alive.current = true;
    room.current = null;
    latest.current = 0;
    setSnapshot(null);
    async function poll() {
      if (cancelled) return;
      if (!actionBusy.current) {
        try {
          await request();
          setConnected(true);
        } catch (e) {
          if (!cancelled) {
            setConnected(false);
            setError((e as Error).message);
          }
        }
      }
      if (!cancelled) timer = setTimeout(poll, document.hidden ? 3000 : 1000);
    }
    liveSession()
      .then(async (s) => {
        if (cancelled) return;
        token.current = s.token;
        const invite = new URLSearchParams(location.search).get("room");
        if (invite && (mode === "game" || mode === "doc")) {
          try {
            await request("join", { invite });
          } catch (e) {
            setError((e as Error).message);
          }
        }
        await poll();
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
      alive.current = false;
      clearTimeout(timer);
    };
  }, [hydrated, me?.email, mode, request]);
  const act = useCallback(
    async (action: string, payload: Record<string, unknown> = {}) => {
      if (actionBusy.current || !token.current) return null;
      actionBusy.current = true;
      setBusy(true);
      setError("");
      try {
        return await request(action, payload);
      } catch (e) {
        setError((e as Error).message);
        return null;
      } finally {
        actionBusy.current = false;
        setBusy(false);
      }
    },
    [request],
  );
  return {
    snapshot,
    connected,
    error,
    busy,
    act,
    clearError: () => setError(""),
  };
}

export function useLiveClock(serverTime?: number) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (!serverTime) return;
    const offset = serverTime - Date.now();
    setNow(serverTime);
    const timer = setInterval(() => setNow(Date.now() + offset), 1000);
    return () => clearInterval(timer);
  }, [serverTime]);
  return now;
}
