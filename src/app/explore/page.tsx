"use client";
import React, { useEffect, useState } from "react";
import { AppShell } from "@/components/shell";
import { PageHeader } from "@/components/ui";
import { StoryList, type StoryRow } from "@/components/StoryList";

export default function ExplorePage() {
  const [rows, setRows] = useState<StoryRow[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/stories?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .catch(() => []);
      if (!cancelled) setRows(Array.isArray(res) ? res : []);
    })();
    return () => { cancelled = true; };
  }, [q]);

  return (
    <AppShell>
      <PageHeader title="Explore stories" description="Look for stories by title, author, or genre." />

      <div className="mb-6 max-w-xl" role="search">
        <label htmlFor="explore-q" className="sr-only">Search stories</label>
        <input id="explore-q" className="field" placeholder="Search stories, authors, genres…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="border-t-2 border-ink">
        {rows.length === 0 ? (
          <p className="py-8 text-ink-soft">Nothing here yet. Try a different search, or publish something from the editor.</p>
        ) : (
          <StoryList stories={rows} />
        )}
      </div>
    </AppShell>
  );
}
