"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/shell";
import { PageHeader, Icon, Notice } from "@/components/ui";
import {
  StoryList,
  StoryListSkeleton,
  type StoryRow,
} from "@/components/StoryList";
const genres = [
  "Fiction",
  "Fantasy",
  "Sci-Fi",
  "Poetry",
  "Essay",
  "Mystery",
  "Romance",
  "Non-fiction",
  "Horror",
  "Humor",
];
export default function ExploreStoriesPage() {
  const [items, setItems] = useState<StoryRow[]>([]);
  const [q, setQ] = useState("");
  const [genre, setGenre] = useState("");
  const [applied, setApplied] = useState({ q: "", genre: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const request = useRef(0);
  const load = useCallback(async (search: string, category: string) => {
    const current = ++request.current;
    setLoading(true);
    setError(false);
    setApplied({ q: search, genre: category });
    try {
      const r = await fetch(
        `/api/stories/list?${new URLSearchParams({ q: search.trim(), genre: category })}`,
      );
      if (!r.ok) throw new Error();
      const j = await r.json();
      if (current === request.current) setItems(j.items || []);
    } catch {
      if (current === request.current) setError(true);
    } finally {
      if (current === request.current) setLoading(false);
    }
  }, []);
  const invalidateRequests = useCallback(() => {
    request.current++;
  }, []);
  useEffect(() => {
    void load("", "");
    return invalidateRequests;
  }, [load, invalidateRequests]);
  function reset() {
    setQ("");
    setGenre("");
    void load("", "");
  }
  return (
    <AppShell>
      <PageHeader
        title="The reading room"
        description="Stories, poems, and works in progress that writers have chosen to share."
        right={
          <Link href="/editor" className="btn-secondary">
            Share your writing <Icon name="arrow" />
          </Link>
        }
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void load(q, genre);
        }}
        className="mb-7 grid items-end gap-3 sm:grid-cols-[1fr_13rem_auto]"
        role="search"
        aria-label="Find published writing"
      >
        <label className="label">
          Title or author
          <input
            className="field mt-2"
            placeholder="Find your next read…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <label className="label">
          Genre
          <select
            className="field mt-2"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
          >
            <option value="">Every genre</option>
            {genres.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </label>
        <button className="btn-primary" disabled={loading}>
          {loading ? "Finding stories…" : "Find stories"}
        </button>
      </form>
      <div className="section-heading">
        <h2>
          {applied.q || applied.genre ? "Search results" : "Published writing"}
        </h2>
        <span className="text-sm text-muted" role="status">
          {loading
            ? "Loading…"
            : error
              ? "Unavailable"
              : `${items.length}${items.length === 100 ? "+" : ""} ${items.length === 1 ? "piece" : "pieces"}`}
        </span>
      </div>
      {error ? (
        <div className="py-8">
          <Notice tone="danger">
            We couldn’t reach the reading room. Check your connection and try
            again.
          </Notice>
          <button
            className="btn-secondary mt-4"
            onClick={() => void load(applied.q, applied.genre)}
          >
            Try again
          </button>
        </div>
      ) : loading ? (
        <StoryListSkeleton rows={4} />
      ) : items.length ? (
        <StoryList stories={items} />
      ) : (
        <div className="py-12">
          <h2 className="text-2xl">
            {applied.q || applied.genre
              ? "No pieces matched this search."
              : "Every reading room begins with one story."}
          </h2>
          <p className="mt-3 max-w-xl text-ink-soft">
            {applied.q || applied.genre
              ? "Try another title or author, or open up the genre filter."
              : "Published work will appear here. In the meantime, there’s space for yours."}
          </p>
          {applied.q || applied.genre ? (
            <button onClick={reset} className="btn-secondary mt-6">
              Clear search
            </button>
          ) : (
            <Link href="/editor" className="btn-accent mt-6">
              Start writing <Icon name="arrow" />
            </Link>
          )}
        </div>
      )}
    </AppShell>
  );
}
