"use client";
import { useEffect, useState } from "react";

/** Use a configured live server or detect the live endpoint on this host. */
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
    let active = true;
    fetch("/healthz", { cache: "no-store" })
      .then(async response => response.ok && (await response.json()).realtime === true)
      .then(enabled => { if (active) setRt({ status: enabled ? "enabled" : "disabled", url: "" }); })
      .catch(() => { if (active) setRt({ status: "disabled", url: "" }); });
    return () => { active = false; };
  }, []);

  return rt;
}
