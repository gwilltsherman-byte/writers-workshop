"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/shell";
import { Icon, PageHeader, Notice } from "@/components/ui";
import { useAuth } from "@/contexts/auth";
import { DRAFT_KEY, readDraft } from "../../../public/draft-storage.js";

type Story = {
  id: string;
  title: string;
  excerpt: string | null;
  genres: string[];
  createdAt: string;
};
type SharedDraft = {
  id: string;
  title: string;
  roomSlug: string;
  updatedAt: string;
};
type Draft = { title: string; html: string; genres: string[] };

function dateLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? "Date unavailable"
    : date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
}

export default function LibraryPage() {
  const { me, hydrated } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [docs, setDocs] = useState<SharedDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [draftError, setDraftError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const loadDeviceDraft = useCallback(() => {
    try {
      setDraft(readDraft(localStorage));
      setDraftError(false);
    } catch {
      setDraftError(true);
    }
    setDraftLoaded(true);
  }, []);

  useEffect(() => {
    loadDeviceDraft();
    const syncDraft = (event: StorageEvent) => {
      if (event.key === DRAFT_KEY || event.key === null) loadDeviceDraft();
    };
    window.addEventListener("storage", syncDraft);
    window.addEventListener("focus", loadDeviceDraft);
    return () => {
      window.removeEventListener("storage", syncDraft);
      window.removeEventListener("focus", loadDeviceDraft);
    };
  }, [loadDeviceDraft]);

  useEffect(() => {
    if (!hydrated) return;
    setStories([]);
    setDocs([]);
    setError(null);
    if (!me) {
      setLoading(false);
      return;
    }
    let active = true;
    const controller = new AbortController();
    setLoading(true);
    void (async () => {
      try {
        const response = await fetch("/api/library", {
          credentials: "include",
          signal: controller.signal,
        });
        if (response.status === 401)
          throw new Error(
            "Your session has ended. Sign in again to see your published stories and shared drafts.",
          );
        if (!response.ok)
          throw new Error(
            "Your library could not be loaded. Check your connection and try again.",
          );
        const result = await response.json();
        if (!active) return;
        setStories(Array.isArray(result.stories) ? result.stories : []);
        setDocs(Array.isArray(result.docs) ? result.docs : []);
      } catch (caught) {
        if (active)
          setError(
            caught instanceof Error
              ? caught.message
              : "Your library could not be loaded. Try again.",
          );
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
      controller.abort();
    };
  }, [me, hydrated, attempt]);

  const hasDraft = !!(draft?.title.trim() || draft?.html.trim());
  const wordCount = draft?.html.trim().split(/\s+/).filter(Boolean).length || 0;
  const awaitingAccount = !hydrated || loading;

  return (
    <AppShell>
      <PageHeader
        title="Your library"
        description="A place for the work in progress, the work you share, and the stories you’ve put into the world."
      />

      <section
        className="grid gap-5 border-t border-line-strong py-7 md:grid-cols-[13rem_minmax(0,1fr)] md:gap-10"
        aria-labelledby="device-heading"
      >
        <div>
          <h2 id="device-heading" className="font-serif text-xl font-semibold">
            On this device
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Your private draft, saved in this browser as you write.
          </p>
        </div>
        {!draftLoaded ? (
          <p role="status" className="py-4 text-sm text-muted">
            Opening your draft…
          </p>
        ) : draftError ? (
          <Notice tone="danger">
            Your saved draft could not be opened. Its original copy has been
            kept.{" "}
            <Link href="/editor" className="underline">
              Open the writing desk
            </Link>{" "}
            to restore a backup.
          </Notice>
        ) : hasDraft ? (
          <article className="min-w-0 border border-line bg-surface-raised px-5 py-6 sm:px-7">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="min-w-0 break-words font-mono text-xl font-bold">
                {draft?.title.trim() || "Untitled draft"}
              </h3>
              <span className="text-xs tabular-nums text-muted">
                {wordCount.toLocaleString()}{" "}
                {wordCount === 1 ? "word" : "words"}
              </span>
            </div>
            {draft?.html.trim() ? (
              <p className="mt-4 line-clamp-3 whitespace-pre-wrap break-words font-mono text-sm leading-7 text-ink-soft">
                {draft.html}
              </p>
            ) : (
              <p className="mt-3 text-sm leading-6 text-muted">
                A title is a beginning. The first sentence is waiting.
              </p>
            )}
            {!!draft?.genres.length && (
              <p className="mt-3 text-xs text-muted">
                {draft.genres.join(" · ")}
              </p>
            )}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-4">
              <p className="text-xs text-muted">
                Only on this device · private
              </p>
              <Link href="/editor" className="btn-accent">
                Keep writing <Icon name="arrow" />
              </Link>
            </div>
          </article>
        ) : (
          <div className="py-2">
            <h3 className="font-serif text-2xl">
              Every story begins somewhere.
            </h3>
            <p className="mt-3 max-w-lg text-sm leading-6 text-muted">
              Open the writing desk and start a piece. It saves here
              automatically, even before you sign in.
            </p>
            <Link href="/editor" className="btn-accent mt-5">
              Start writing <Icon name="arrow" />
            </Link>
          </div>
        )}
      </section>

      {hydrated && !me ? (
        <section
          className="grid gap-5 border-y border-line py-7 md:grid-cols-[13rem_minmax(0,1fr)] md:gap-10"
          aria-labelledby="account-library-heading"
        >
          <div>
            <h2
              id="account-library-heading"
              className="font-serif text-xl font-semibold"
            >
              Beyond the desk
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Your account library.
            </p>
          </div>
          <div className="max-w-xl py-2">
            <p className="text-base leading-7 text-ink-soft">
              Sign in to find the stories you’ve published and the shared drafts
              you’ve worked on with others.
            </p>
            <Link
              href="/auth"
              className="link-accent mt-3 inline-flex min-h-11 items-center gap-2"
            >
              Sign in to your library <Icon name="arrow" />
            </Link>
          </div>
        </section>
      ) : (
        <>
          {error && (
            <div className="my-5">
              <Notice tone="danger">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p>{error}</p>
                  {error.includes("session") ? (
                    <Link href="/auth" className="btn-secondary">
                      Sign in
                    </Link>
                  ) : (
                    <button
                      onClick={() => setAttempt((value) => value + 1)}
                      className="btn-secondary"
                    >
                      Try again
                    </button>
                  )}
                </div>
              </Notice>
            </div>
          )}

          <section
            className="grid gap-5 border-t border-line py-7 md:grid-cols-[13rem_minmax(0,1fr)] md:gap-10"
            aria-labelledby="shared-heading"
          >
            <div>
              <h2
                id="shared-heading"
                className="font-serif text-xl font-semibold"
              >
                Shared drafts
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                The pieces you’re writing with a partner.
              </p>
            </div>
            {awaitingAccount ? (
              <p role="status" className="py-4 text-sm text-muted">
                Loading shared drafts…
              </p>
            ) : error ? (
              <p className="py-3 text-sm text-muted">
                Shared drafts are unavailable until your library reconnects.
              </p>
            ) : docs.length ? (
              <ul className="min-w-0 divide-y divide-line">
                {docs.map((doc) => (
                  <li
                    key={doc.id}
                    className="flex flex-col justify-between gap-3 py-4 first:pt-0 sm:flex-row sm:items-center sm:gap-6"
                  >
                    <div className="min-w-0">
                      <h3 className="break-words font-serif text-xl font-semibold">
                        {doc.title || "Untitled shared draft"}
                      </h3>
                      <p className="mt-2 text-xs text-muted">
                        Updated {dateLabel(doc.updatedAt)}
                      </p>
                    </div>
                    {doc.roomSlug ? (
                      <Link
                        href={`/collaborate?room=${encodeURIComponent(doc.roomSlug)}`}
                        className="link-accent inline-flex min-h-11 shrink-0 items-center gap-2"
                      >
                        Open shared draft <Icon name="arrow" />
                      </Link>
                    ) : (
                      <span className="text-sm text-muted">
                        Draft link unavailable
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-2">
                <p className="text-sm leading-6 text-muted">
                  No shared drafts yet. Start a piece and invite a writing
                  partner.
                </p>
                <Link
                  href="/collaborate"
                  className="link-accent mt-2 inline-flex min-h-11 items-center gap-2"
                >
                  Write together <Icon name="arrow" />
                </Link>
              </div>
            )}
          </section>

          <section
            className="grid gap-5 border-y border-line py-7 md:grid-cols-[13rem_minmax(0,1fr)] md:gap-10"
            aria-labelledby="published-heading"
          >
            <div>
              <h2
                id="published-heading"
                className="font-serif text-xl font-semibold"
              >
                Published stories
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Your writing, out in the world.
              </p>
            </div>
            {awaitingAccount ? (
              <p role="status" className="py-4 text-sm text-muted">
                Loading published stories…
              </p>
            ) : error ? (
              <p className="py-3 text-sm text-muted">
                Published stories are unavailable until your library reconnects.
              </p>
            ) : stories.length ? (
              <ul className="min-w-0 divide-y divide-line">
                {stories.map((story) => (
                  <li key={story.id} className="py-5 first:pt-0">
                    <article>
                      <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-2">
                        <h3 className="min-w-0 break-words font-serif text-2xl font-semibold">
                          <Link
                            href={`/stories/${story.id}`}
                            className="hover:text-accent"
                          >
                            {story.title}
                          </Link>
                        </h3>
                        <time
                          dateTime={story.createdAt}
                          className="shrink-0 text-xs text-muted"
                        >
                          {dateLabel(story.createdAt)}
                        </time>
                      </div>
                      {!!story.genres?.length && (
                        <p className="mt-2 text-xs text-muted">
                          {story.genres.join(" · ")}
                        </p>
                      )}
                      {story.excerpt && (
                        <p className="mt-3 line-clamp-2 break-words font-serif text-base leading-7 text-ink-soft">
                          {story.excerpt}
                        </p>
                      )}
                      <Link
                        className="link-accent mt-2 inline-flex min-h-11 items-center gap-2"
                        href={`/stories/${story.id}`}
                      >
                        Read story <Icon name="arrow" />
                      </Link>
                    </article>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-2">
                <p className="text-sm leading-6 text-muted">
                  When a piece is ready, publish it from the writing desk. It
                  will appear here and in Stories.
                </p>
                <Link
                  href="/editor"
                  className="link-accent mt-2 inline-flex min-h-11 items-center gap-2"
                >
                  Go to your draft <Icon name="arrow" />
                </Link>
              </div>
            )}
          </section>
        </>
      )}
    </AppShell>
  );
}
