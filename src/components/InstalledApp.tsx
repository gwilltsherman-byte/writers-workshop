"use client";
import { useEffect } from "react";
export function InstalledApp() {
  useEffect(() => {
    if ("serviceWorker" in navigator) void navigator.serviceWorker.register("/sw.js").catch(() => {});
    const retain = () => { void navigator.storage?.persist?.().catch(() => {}); };
    document.addEventListener("pointerdown", retain, { once: true });
    return () => document.removeEventListener("pointerdown", retain);
  }, []);
  return null;
}
