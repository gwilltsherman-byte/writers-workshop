"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/shell";
import { LogoMark } from "@/components/Logo";
import { Icon, Notice } from "@/components/ui";
import { useParams } from "next/navigation";

type Story = { id: string; title: string; html: string; authorName?: string; createdAt?: string; genres?: string[] };

export default function StoryPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [story, setStory] = useState<Story | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true); setError(null);
      try {
        const r = await fetch(`/api/stories/${id}`, { credentials: "include" });
        const txt = await r.text();
        let j: any;
        try { j = JSON.parse(txt); } catch { throw new Error("Failed to load"); }
        if (!r.ok) throw new Error(j?.error || "failed");
        setStory(j.story);
        if (j.story?.title) document.title = `${j.story.title} | Writers’ Workshop`;
      } catch (e: any) {
        setError(e?.message || "Failed to load");
      } finally { setLoading(false); }
    })();
  }, [id]);

  return (
    <AppShell>
      <div className="mx-auto max-w-prose">
        <Link href="/stories" className="-ml-1 mb-10 inline-flex min-h-11 items-center gap-1.5 px-1 text-[0.9375rem] text-muted transition-colors hover:text-ink">
          <Icon name="back" size={15} />
          All stories
        </Link>

        {loading && (
          <div className="space-y-4" aria-hidden>
            <div className="h-10 w-2/3 animate-pulse rounded bg-surface-sunken" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-surface-sunken" />
            <div className="mt-10 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-4 animate-pulse rounded bg-surface-sunken" />)}
            </div>
          </div>
        )}

        {error && <Notice tone="danger">We couldn’t load this story. It may have been removed, or the link is wrong.</Notice>}

        {story && (
          <article>
            <h1 className="text-title font-semibold text-ink">{story.title}</h1>
            {(story.authorName || (story.genres?.length ?? 0) > 0) && (
              <p className="mt-4 text-lg italic text-ink-soft">
                {story.authorName && <>by {story.authorName}</>}
                {story.authorName && (story.genres?.length ?? 0) > 0 && <span className="text-muted">, </span>}
                {(story.genres?.length ?? 0) > 0 && <span className="text-muted">{story.genres!.join(" and ").toLowerCase()}</span>}
              </p>
            )}
            <div className="reader mt-10 whitespace-pre-wrap border-t border-line pt-10">{story.html}</div>
            {/* End mark, as magazines close a piece. */}
            <div className="mt-12 flex justify-center" aria-hidden>
              <LogoMark size={20} />
            </div>
          </article>
        )}
      </div>
    </AppShell>
  );
}
