import React from "react";
import Link from "next/link";

export type StoryRow = {
  id: string;
  title: string;
  excerpt?: string | null;
  genres?: string[];
  authorName: string;
  publishedAt?: string;
};

/** Published stories as a plain contents list: title, byline, opening lines, date. */
export function StoryList({ stories }: { stories: StoryRow[] }) {
  return (
    <ol className="divide-y divide-line">
      {stories.map((s) => (
        <li key={s.id}>
          <Link
            href={`/stories/${s.id}`}
            className="group grid gap-x-8 gap-y-1 py-6 sm:grid-cols-[1fr_auto]"
          >
            <div className="min-w-0">
              <h3 className="text-[1.4rem] font-medium leading-snug text-ink transition-colors duration-150 group-hover:text-accent">
                {s.title}
              </h3>
              <p className="mt-1 text-sm text-muted">
                by {s.authorName}
                {s.genres?.length
                  ? `, ${s.genres.slice(0, 2).join(" and ").toLowerCase()}`
                  : ""}
              </p>
              {s.excerpt && (
                <p className="mt-2 line-clamp-2 max-w-[65ch] font-serif text-base leading-7 text-ink-soft">
                  {s.excerpt}
                </p>
              )}
            </div>
            {s.publishedAt && (
              <time
                dateTime={s.publishedAt}
                className="order-first text-sm tabular-nums text-muted sm:order-none sm:pt-1.5"
              >
                {new Date(s.publishedAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </time>
            )}
          </Link>
        </li>
      ))}
    </ol>
  );
}

export function StoryListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="divide-y divide-line" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-2.5 py-6">
          <div className="h-5 w-2/5 animate-pulse rounded bg-surface-sunken" />
          <div className="h-3.5 w-1/4 animate-pulse rounded bg-surface-sunken" />
          <div className="h-3.5 w-3/4 animate-pulse rounded bg-surface-sunken" />
        </div>
      ))}
    </div>
  );
}
