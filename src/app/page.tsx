"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/shell";
import { Icon } from "@/components/ui";
import { IndexCard } from "@/components/IndexCard";
import { StoryList, StoryListSkeleton, type StoryRow } from "@/components/StoryList";
import { createPromptDeck, type GamePrompt } from "@/lib/prompts";

function promptHref(p: GamePrompt) {
  return `/editor?prompt=${encodeURIComponent(p.twist ? `${p.text} ${p.twist}` : p.text)}`;
}

function PromptCard() {
  const deck = useRef<ReturnType<typeof createPromptDeck> | null>(null);
  const [prompt, setPrompt] = useState<GamePrompt | null>(null);
  const [dealt, setDealt] = useState(0);

  // Drawn after mount so the server and client render the same markup.
  const draw = useCallback(() => {
    deck.current ??= createPromptDeck();
    setPrompt(deck.current.next());
    setDealt((n) => n + 1);
  }, []);
  useEffect(() => draw(), [draw]);

  return (
    <div>
      <IndexCard label="Need something to write about?" cardKey={dealt} className="lg:-rotate-1" linesClassName="min-h-[12rem]">
        {prompt && (
          <>
            <p>{prompt.text}</p>
            {prompt.twist && <p><span className="font-bold">The catch:</span> {prompt.twist}</p>}
          </>
        )}
      </IndexCard>
      <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 px-1">
        {prompt && (
          <Link href={promptHref(prompt)} className="link-accent py-2">
            Write this one
          </Link>
        )}
        <button onClick={draw} className="min-h-11 text-ink-soft underline decoration-line-strong underline-offset-4 transition-colors hover:text-ink hover:decoration-ink">
          Give me another
        </button>
      </div>
    </div>
  );
}

function RecentStories() {
  const [stories, setStories] = useState<StoryRow[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch("/api/stories/list?limit=5")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j) => setStories(j.items || []))
      .catch(() => setFailed(true));
  }, []);

  // If the library can't be reached, leave the section out rather than claim it's empty.
  if (failed) return null;

  return (
    <section className="mt-24 lg:mt-32">
      <div className="flex items-baseline justify-between gap-4 border-b-2 border-ink pb-3">
        <h2 className="text-2xl font-semibold text-ink">Recently published</h2>
        <Link href="/stories" className="inline-flex items-center gap-1.5 py-2 text-[0.9375rem] text-ink-soft transition-colors hover:text-ink">
          All stories <Icon name="arrow" size={15} />
        </Link>
      </div>

      {stories === null && <StoryListSkeleton />}

      {stories?.length === 0 && (
        <p className="py-6 text-ink-soft">
          Nothing’s been published yet. <Link href="/editor" className="link-accent">Yours could be the first.</Link>
        </p>
      )}

      {!!stories?.length && <StoryList stories={stories} />}
    </section>
  );
}

export default function Page() {
  return (
    <AppShell>
      <section className="grid items-center gap-14 pt-2 lg:grid-cols-[7fr_5fr] lg:gap-20 lg:pt-12">
        <div>
          <h1 className="max-w-[12ch] text-display font-semibold text-ink">
            Get feedback on your writing.
          </h1>
          <p className="mt-6 max-w-[40ch] text-xl leading-relaxed text-ink-soft">
            Swap critiques with other writers.<br className="hidden sm:inline" /> Publish when it’s ready.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link href="/editor" className="btn-accent px-6 text-base">Start writing</Link>
            <Link href="/critique/short" className="min-h-11 py-2.5 text-base text-ink underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-ink">
              Get a critique
            </Link>
          </div>
        </div>

        <PromptCard />
      </section>

      <RecentStories />
    </AppShell>
  );
}
