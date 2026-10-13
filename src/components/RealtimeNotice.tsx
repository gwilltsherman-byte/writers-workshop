import React from "react";
import Link from "next/link";

/**
 * Shown on realtime pages when no live socket server is reachable (e.g. a plain
 * static deployment). Explains the situation instead of spinning forever.
 */
export default function RealtimeNotice({
  feature,
  children,
}: React.PropsWithChildren<{ feature: string }>) {
  return (
    <div className="max-w-2xl">
      <div className="border-t-2 border-ink">
        <h2 className="pt-6 text-2xl font-semibold text-ink">{feature} needs a live server</h2>
        <div className="mt-4 max-w-[65ch] space-y-4 leading-7 text-ink-soft">
          <p>
            {feature} needs a live (WebSocket) connection to work. A live server is not reachable from this site yet.
          </p>
          <p className="text-[0.9375rem]">
            {children ?? (
              <>
                To use it, run the app locally with <code className="rounded bg-surface-sunken px-1.5 py-0.5 font-mono text-[0.92em]">npm run dev</code>,
                or deploy the realtime server to an always-on host and set{" "}
                <code className="rounded bg-surface-sunken px-1.5 py-0.5 font-mono text-[0.92em]">NEXT_PUBLIC_REALTIME_URL</code>.
              </>
            )}
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Link href="/editor" className="btn-primary">Open the editor</Link>
            <Link href="/stories" className="btn-secondary">Browse stories</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
