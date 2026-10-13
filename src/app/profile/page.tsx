"use client";
import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/shell";
import { PageHeader } from "@/components/ui";
import { useAuth } from "@/contexts/auth";

export default function ProfilePage() {
  const { me, hydrated } = useAuth();
  const [data, setData] = React.useState<{ docs: any[]; stories: any[] } | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/my/library", { credentials: "include" });
        if (r.ok) setData(await r.json());
      } catch {}
    })();
  }, []);

  if (hydrated && !me) {
    return (
      <AppShell>
        <div className="max-w-xl py-12">
          <h1 className="text-title font-semibold text-ink">You’re signed out</h1>
          <p className="mt-3 text-lg text-ink-soft">Sign in to see your profile, drafts, and published work.</p>
          <Link href="/auth" className="btn-accent mt-6 inline-flex px-5">Log in</Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="Profile"
        right={<Link href="/settings" className="btn-secondary px-4">Settings</Link>}
      />

      <div className="mb-10 flex items-center gap-4">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-ink text-2xl font-semibold text-paper">
          {me?.name?.[0]?.toUpperCase() ?? "?"}
        </span>
        <div>
          <div className="text-xl font-semibold text-ink">{me?.name ?? "…"}</div>
          <div className="text-[0.9375rem] text-muted">{me?.email}</div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="card overflow-hidden">
          <h2 className="border-b border-line px-5 py-4 font-serif text-lg font-semibold text-ink">Saved documents</h2>
          <ul className="divide-y divide-line">
            {(data?.docs || []).length === 0 && <li className="px-5 py-6 text-sm text-muted">No documents yet.</li>}
            {(data?.docs || []).map((d: any) => (
              <li key={d.id} className="px-5 py-3.5 text-ink">{d.title || "Untitled"}</li>
            ))}
          </ul>
        </section>
        <section className="card overflow-hidden">
          <h2 className="border-b border-line px-5 py-4 font-serif text-lg font-semibold text-ink">Published stories</h2>
          <ul className="divide-y divide-line">
            {(data?.stories || []).length === 0 && <li className="px-5 py-6 text-sm text-muted">Nothing published yet.</li>}
            {(data?.stories || []).map((s: any) => (
              <li key={s.id} className="px-5 py-3.5">
                <Link href={`/stories/${s.id}`} className="text-ink transition hover:text-accent">{s.title || "Untitled"}</Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AppShell>
  );
}
