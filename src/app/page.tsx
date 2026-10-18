"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/shell";
import { Icon, Notice } from "@/components/ui";
import {
  StoryList,
  StoryListSkeleton,
  type StoryRow,
} from "@/components/StoryList";
import { createPromptDeck, type GamePrompt } from "@/lib/prompts";
import { readDraft } from "../../public/draft-storage.js";
import { useAuth } from "@/contexts/auth";

function StartingPoint() {
  const deck = useRef<ReturnType<typeof createPromptDeck> | null>(null);
  const [prompt, setPrompt] = useState<GamePrompt | null>(null);
  const [dealt, setDealt] = useState(0);
  const draw = useCallback(() => {
    deck.current ??= createPromptDeck();
    setPrompt(deck.current.next());
    setDealt((n) => n + 1);
  }, []);
  useEffect(() => draw(), [draw]);
  return (
    <section className="starting-point" aria-labelledby="starting-point-title">
      <div className="prompt-heading">
        <h2 id="starting-point-title">A starting point</h2>
        <button
          onClick={draw}
          className="prompt-shuffle"
          aria-label="Try another prompt"
          title="Try another prompt"
        >
          <Icon name="refresh" size={18} />
        </button>
      </div>
      <div className="prompt-words" key={dealt} aria-live="polite">
        {prompt ? (
          <>
            <p>{prompt.text}</p>
            {prompt.twist && <p className="prompt-twist">{prompt.twist}</p>}
          </>
        ) : (
          <p>Finding a first sentence…</p>
        )}
      </div>
      <div className="prompt-bottom">
        <span>Follow it somewhere unexpected.</span>
        {prompt && (
          <Link
            href={`/editor?prompt=${encodeURIComponent([prompt.text, prompt.twist].filter(Boolean).join(" "))}`}
          >
            Write from this <Icon name="arrow" size={17} />
          </Link>
        )}
      </div>
    </section>
  );
}

function DraftDesk() {
  const [draft, setDraft] = useState<ReturnType<typeof readDraft> | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    try {
      setDraft(readDraft(localStorage));
    } catch {
      setFailed(true);
    }
  }, []);
  const hasDraft = !!(draft?.title.trim() || draft?.html.trim());
  const words = draft?.html.trim().split(/\s+/).filter(Boolean).length || 0;
  return (
    <section className="draft-desk" aria-labelledby="draft-heading">
      <div className="desk-caption">
        <span>
          <Icon name="pen" size={17} /> Your private draft
        </span>
        <span>On this device</span>
      </div>
      <div className="draft-preview">
        <h2 id="draft-heading">
          {hasDraft
            ? draft?.title || "Untitled draft"
            : "There’s a story in here."}
        </h2>
        {failed ? (
          <Notice tone="danger">
            Your saved draft couldn’t be opened. Go to the editor to restore a
            backup.
          </Notice>
        ) : draft === null ? (
          <p className="text-muted" role="status">
            Opening your writing…
          </p>
        ) : hasDraft ? (
          <p className="draft-excerpt">
            {draft.html ||
              "The title is a beginning. Give it a first sentence."}
          </p>
        ) : (
          <p className="draft-invitation">
            An opening line. A half-formed thought. <br />
            Give it a little room to become something.
          </p>
        )}
      </div>
      <div className="desk-bottom">
        <Link href="/editor" className="btn-accent">
          {hasDraft ? "Continue writing" : "Start writing"}
          <Icon name="arrow" size={17} />
        </Link>
        <span>
          {hasDraft
            ? `${words.toLocaleString()} ${words === 1 ? "word" : "words"} · saved here`
            : "No account needed. Just your words."}
        </span>
      </div>
    </section>
  );
}

function RecentStories() {
  const [stories, setStories] = useState<StoryRow[] | null>(null);
  const [failed, setFailed] = useState(false);
  const load = useCallback(async () => {
    setFailed(false);
    setStories(null);
    try {
      const r = await fetch("/api/stories/list?limit=3");
      if (!r.ok) throw new Error();
      const j = await r.json();
      setStories(j.items || []);
    } catch {
      setFailed(true);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  return (
    <section className="recent-stories">
      <div className="section-heading">
        <h2>From the workshop</h2>
        <Link href="/stories">
          All stories <Icon name="arrow" size={16} />
        </Link>
      </div>
      {failed ? (
        <div className="empty-inline">
          <p>
            Stories couldn’t be loaded. Your private draft is still available.
          </p>
          <button className="btn-secondary" onClick={() => void load()}>
            Try again
          </button>
        </div>
      ) : stories === null ? (
        <StoryListSkeleton rows={2} />
      ) : stories.length ? (
        <StoryList stories={stories} />
      ) : (
        <div className="empty-inline">
          <div>
            <h3>The first page is still open.</h3>
            <p>When a writer publishes, their work will appear here.</p>
          </div>
          <Link href="/editor" className="link-accent">
            Write something to share
          </Link>
        </div>
      )}
    </section>
  );
}

export default function Page() {
  const { me } = useAuth();
  return (
    <AppShell>
      <div className="desk-welcome">
        <div>
          <h1>
            {me
              ? `Make yourself at home, ${me.name.split(" ")[0]}.`
              : "Make room for your writing."}
          </h1>
          <p>A quiet place to begin. Good company when you’re ready.</p>
        </div>
        <Link href="/library" className="subtle-link">
          My library <Icon name="arrow" size={16} />
        </Link>
      </div>
      <div className="desk-grid">
        <DraftDesk />
        <StartingPoint />
      </div>
      <section className="workshop-paths" aria-label="Find your next step">
        <div className="path-intro">
          <h2>
            Better with <br />
            another reader.
          </h2>
          <p>
            Writing is yours. <br />
            The workshop is shared.
          </p>
        </div>
        <Link href="/critique/short" className="workshop-path">
          <span className="path-top">
            Exchange critiques <Icon name="arrow" size={18} />
          </span>
          <p>
            Read a piece. Offer a fresh eye. <br />
            Get thoughtful notes in return.
          </p>
          <span className="path-detail">Ten minutes, two writers</span>
        </Link>
        <Link href="/game6" className="workshop-path">
          <span className="path-top">
            Play with an idea <Icon name="arrow" size={18} />
          </span>
          <p>
            A prompt, a little time pressure, <br />
            and a room full of possibilities.
          </p>
          <span className="path-detail">Three rounds · 2–6 writers</span>
        </Link>
      </section>
      <RecentStories />
    </AppShell>
  );
}
