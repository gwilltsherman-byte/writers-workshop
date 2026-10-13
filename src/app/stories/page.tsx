"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/shell";
import { PageHeader } from "@/components/ui";
import { StoryList, StoryListSkeleton, type StoryRow } from "@/components/StoryList";

export default function ExploreStoriesPage() {
  const [items, setItems] = useState<StoryRow[]>([]);
  const [q, setQ] = useState("");
  const [genre, setGenre] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (genre.trim()) params.set("genre", genre.trim());
    try {
      const r = await fetch(`/api/stories/list?${params.toString()}`, { credentials: "include" });
      const j = await r.json();
      setItems(j.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppShell>
      <PageHeader
        title="Explore stories"
        description="Read what other writers have published. Search by title, author, or genre."
      />

      <form
        onSubmit={(e) => { e.preventDefault(); load(); }}
        className="mb-6 flex flex-col gap-2 sm:flex-row"
        role="search"
      >
        <label htmlFor="story-q" className="sr-only">Search titles or authors</label>
        <input id="story-q" className="field flex-1" placeholder="Search titles or authors…" value={q} onChange={(e) => setQ(e.target.value)} />
        <label htmlFor="story-genre" className="sr-only">Genre</label>
        <input id="story-genre" className="field sm:w-52" placeholder="Genre (optional)" value={genre} onChange={(e) => setGenre(e.target.value)} />
        <button className="btn-primary px-5">Search</button>
      </form>

      <div className="border-t-2 border-ink">
        {loading ? (
          <StoryListSkeleton rows={4} />
        ) : items.length === 0 ? (
          <div className="py-10">
            <p className="text-xl font-semibold text-ink">No stories found</p>
            <p className="mt-2 text-ink-soft">Try a different search, or publish the first one from the editor.</p>
            <Link href="/editor" className="btn-accent mt-6 px-5">Start writing</Link>
          </div>
        ) : (
          <StoryList stories={items} />
        )}
      </div>
    </AppShell>
  );
}
