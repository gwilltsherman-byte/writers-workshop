"use client";
import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/shell";
import { PageHeader, Notice } from "@/components/ui";
import { useAuth } from "@/contexts/auth";

export default function ProfilePage() {
  const { me, hydrated } = useAuth();
  const [data, setData] = React.useState<{
    docs: any[];
    stories: any[];
  } | null>(null);
  const [error, setError] = React.useState("");
  const [retry, setRetry] = React.useState(0);

  React.useEffect(() => {
    if (!hydrated || !me) return;
    let cancelled = false;
    setData(null);
    setError("");
    (async () => {
      try {
        const r = await fetch("/api/my/library", { credentials: "include" });
        if (!r.ok) throw new Error();
        const result = await r.json();
        if (!cancelled) setData(result);
      } catch {
        if (!cancelled)
          setError(
            "Your work could not be loaded. Check your connection and try again.",
          );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrated, me, retry]);

  if (!hydrated)
    return (
      <AppShell>
        <p role="status" className="py-12 text-muted">
          Loading your profile…
        </p>
      </AppShell>
    );

  if (hydrated && !me) {
    return (
      <AppShell>
        <div className="max-w-xl py-12">
          <h1 className="text-title font-semibold text-ink">
            You’re signed out
          </h1>
          <p className="mt-3 text-lg text-ink-soft">
            Sign in to see your profile, drafts, and published work.
          </p>
          <Link href="/auth" className="btn-accent mt-6 inline-flex px-5">
            Log in
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="Profile"
        right={
          <Link href="/settings" className="btn-secondary px-4">
            Settings
          </Link>
        }
      />

      <div className="mb-10 flex items-center gap-4">
        <span
          aria-hidden="true"
          className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-ink text-2xl font-semibold text-paper"
        >
          {me?.name?.[0]?.toUpperCase() ?? "?"}
        </span>
        <div className="min-w-0">
          <div className="break-words text-xl font-semibold text-ink">
            {me?.name ?? "…"}
          </div>
          <div className="break-all text-[0.9375rem] text-muted">
            {me?.email}
          </div>
        </div>
      </div>

      {error ? (
        <Notice tone="danger">
          {error}{" "}
          <button
            className="underline underline-offset-4"
            onClick={() => setRetry((value) => value + 1)}
          >
            Try again
          </button>
        </Notice>
      ) : !data ? (
        <p role="status" className="py-6 text-muted">
          Loading your work…
        </p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <section className="card overflow-hidden">
            <h2 className="border-b border-line px-5 py-4 font-serif text-lg font-semibold text-ink">
              Saved documents
            </h2>
            <ul className="divide-y divide-line">
              {(data?.docs || []).length === 0 && (
                <li className="px-5 py-6 text-sm text-muted">
                  No documents yet.
                </li>
              )}
              {(data?.docs || []).map((d: any) => (
                <li key={d.id} className="break-words px-5 py-3.5 text-ink">
                  {d.title || "Untitled"}
                </li>
              ))}
            </ul>
          </section>
          <section className="card overflow-hidden">
            <h2 className="border-b border-line px-5 py-4 font-serif text-lg font-semibold text-ink">
              Published stories
            </h2>
            <ul className="divide-y divide-line">
              {(data?.stories || []).length === 0 && (
                <li className="px-5 py-6 text-sm text-muted">
                  Nothing published yet.
                </li>
              )}
              {(data?.stories || []).map((s: any) => (
                <li key={s.id} className="break-words px-5 py-3.5">
                  <Link
                    href={`/stories/${s.id}`}
                    className="text-ink transition hover:text-accent"
                  >
                    {s.title || "Untitled"}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </AppShell>
  );
}
