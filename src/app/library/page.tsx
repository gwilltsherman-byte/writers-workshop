"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/shell";
import { PageHeader, Notice } from "@/components/ui";

type Story = { id: string; title: string; excerpt: string | null; genres: string[]; createdAt: string };
type Doc = { id: string; title: string; updatedAt: string };

export default function LibraryPage() {
  const [error, setError] = useState<string | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/library", { credentials: "include" });
        if (r.status === 401) throw new Error("Sign in to see your library.");
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j = await r.json();
        setStories(j.stories || []);
        setDocs(j.docs || []);
      } catch (e: any) {
        setError(e.message || "Failed to load.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <AppShell>
      <PageHeader
        title="Library"
        description="Your saved drafts and the stories you’ve published."
        right={<Link href="/editor" className="btn-accent px-4">New draft</Link>}
      />

      {error && <div className="mb-6"><Notice tone="danger">{error}</Notice></div>}

      <div className="grid gap-6 md:grid-cols-2">
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-serif text-lg font-semibold text-ink">Saved drafts</h2>
            <span className="tabular-nums text-muted">{loading ? "" : docs.length}</span>
          </div>
          <div className="divide-y divide-line">
            {loading && <div className="space-y-2 px-5 py-6" aria-hidden><div className="h-4 w-1/2 animate-pulse rounded bg-surface-sunken" /><div className="h-3 w-1/3 animate-pulse rounded bg-surface-sunken" /></div>}
            {!loading && docs.length === 0 && <div className="px-5 py-8 text-sm text-muted">No saved snapshots yet.</div>}
            {docs.map((d) => (
              <div key={d.id} className="px-5 py-4">
                <div className="font-medium text-ink">{(d as any).title || "Untitled"}</div>
                <div className="mt-0.5 text-sm text-muted">Updated {new Date(d.updatedAt).toLocaleString()}</div>
                <Link className="link-accent mt-2 inline-flex items-center gap-1.5 text-[0.9375rem]" href={`/editor?doc=${d.id}`}>Open in editor</Link>
              </div>
            ))}
          </div>
        </section>

        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-serif text-lg font-semibold text-ink">Published stories</h2>
            <span className="tabular-nums text-muted">{loading ? "" : stories.length}</span>
          </div>
          <div className="divide-y divide-line">
            {loading && <div className="space-y-2 px-5 py-6" aria-hidden><div className="h-4 w-1/2 animate-pulse rounded bg-surface-sunken" /><div className="h-3 w-1/3 animate-pulse rounded bg-surface-sunken" /></div>}
            {!loading && stories.length === 0 && <div className="px-5 py-8 text-sm text-muted">Nothing published yet.</div>}
            {stories.map((s) => (
              <div key={s.id} className="px-5 py-4">
                <div className="font-medium text-ink">{s.title}</div>
                <div className="mt-0.5 text-sm italic text-muted">{(s.genres || []).join(", ")}</div>
                {s.excerpt && <p className="mt-1.5 line-clamp-2 text-[0.9375rem] leading-6 text-ink-soft">{s.excerpt}</p>}
                <Link className="link-accent mt-2 inline-flex text-[0.9375rem]" href={`/stories/${s.id}`}>Read it</Link>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
