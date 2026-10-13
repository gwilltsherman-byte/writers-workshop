"use client";
import { useEffect, useState } from "react";

/**
 * Realtime (Socket.IO) is served by a persistent Node server, which Netlify's
 * serverless platform cannot host. This hook decides, on the client, whether a
 * live connection is possible:
 *
 *  - If NEXT_PUBLIC_REALTIME_URL is set, connect there (a companion host).
 *  - Otherwise, same-origin sockets only work when a realtime server is
 *    present, which means local dev via `npm run dev`. We detect localhost.
 *  - On a plain Netlify deploy with no companion URL, realtime is disabled and
 *    pages should render a graceful notice instead of retrying forever.
 */
export const REALTIME_URL = process.env.NEXT_PUBLIC_REALTIME_URL || "";

export type RealtimeStatus = "checking" | "enabled" | "disabled";

export type Realtime = {
  status: RealtimeStatus;
  /** Pass to io(); empty string means "same origin". */
  url: string;
};

export function useRealtime(): Realtime {
  const [rt, setRt] = useState<Realtime>({ status: "checking", url: "" });

  useEffect(() => {
    if (REALTIME_URL) {
      setRt({ status: "enabled", url: REALTIME_URL });
      return;
    }
    const host = window.location.hostname;
    const local = host === "localhost" || host === "127.0.0.1" || host.endsWith(".local");
    setRt(local ? { status: "enabled", url: "" } : { status: "disabled", url: "" });
  }, []);

  return rt;
}
