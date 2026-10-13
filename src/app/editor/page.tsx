"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/shell";
import { cx, Icon, Notice } from "@/components/ui";
import { useAuth } from "@/contexts/auth";

const categories = [
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
const STORAGE_KEY = "ww-editor-draft";

export default function EditorPage() {
  const { me } = useAuth();
  const [title, setTitle] = useState("");
  const [html, setHtml] = useState("");
  const [genres, setGenres] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("Saved in this browser");
  const [notice, setNotice] = useState<{
    tone: "success" | "danger";
    text: React.ReactNode;
  } | null>(null);
  const [prompt, setPrompt] = useState<string | null>(null);

  const wordCount = useMemo(
    () => html.trim().split(/\s+/).filter(Boolean).length,
    [html],
  );
  const charCount = html.length;
  const readTime = Math.max(1, Math.ceil(wordCount / 220));
  // Manuscript convention: past a hundred words, round to the nearest hundred.
  const manuscriptCount =
    wordCount < 100
      ? `${wordCount} ${wordCount === 1 ? "word" : "words"}`
      : `about ${(Math.round(wordCount / 100) * 100).toLocaleString()} words`;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const draft = JSON.parse(saved);
        setTitle(draft.title || "");
        setHtml(draft.html || "");
        setGenres(Array.isArray(draft.genres) ? draft.genres : []);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ title, html, genres }),
      );
      setStatus("Saved in this browser");
    } catch {}
  }, [title, html, genres]);

  // A prompt picked on the home page arrives as ?prompt=...
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("prompt");
    if (p) setPrompt(p.slice(0, 500));
  }, []);

  function dismissPrompt() {
    setPrompt(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("prompt");
    window.history.replaceState(null, "", url);
  }

  async function publish() {
    if (!title.trim() || !html.trim()) {
      setNotice({
        tone: "danger",
        text: "Add a title and some writing before you publish.",
      });
      return;
    }
    setNotice(null);
    setSaving(true);
    try {
      const r = await fetch("/api/stories", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, html, genres }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.status === 401) {
        setNotice({
          tone: "danger",
          text: (
            <>
              You need to{" "}
              <Link href="/auth" className="underline">
                log in
              </Link>{" "}
              to publish. Your draft is still saved in this browser.
            </>
          ),
        });
        return;
      }
      if (!r.ok) throw new Error();
      setNotice({
        tone: "success",
        text: j?.id ? (
          <>
            Published.{" "}
            <Link href={`/stories/${j.id}`} className="underline">
              Read it in Stories
            </Link>
            .
          </>
        ) : (
          "Published to Stories."
        ),
      });
    } catch {
      setNotice({
        tone: "danger",
        text: "Publishing didn’t work. Your draft is safe here; try again in a moment.",
      });
    } finally {
      setSaving(false);
    }
  }

  function toggle(cat: string) {
    setGenres((g) =>
      g.includes(cat) ? g.filter((x) => x !== cat) : [...g, cat],
    );
  }

  return (
    <AppShell>
      <div className="grid gap-10 lg:grid-cols-[1fr_15rem] lg:gap-14">
        <section className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
            <Link href="/collaborate" className="btn-secondary">
              Write together
            </Link>
            <button
              onClick={publish}
              disabled={saving}
              className="btn-accent px-5"
            >
              {saving ? "Publishing…" : "Publish"}
            </button>
          </div>

          {notice && (
            <div className="mb-4">
              <Notice tone={notice.tone}>{notice.text}</Notice>
            </div>
          )}

          {prompt && (
            <div className="mb-4 flex items-start gap-3 border-l-2 border-accent bg-surface-sunken py-2 pl-4 pr-1 leading-7 text-ink-soft">
              <p className="flex-1 py-1">
                <span className="font-semibold text-ink">Your prompt:</span>{" "}
                {prompt}
              </p>
              <button
                onClick={dismissPrompt}
                aria-label="Dismiss prompt"
                className="grid h-11 w-11 shrink-0 place-items-center rounded text-muted transition-colors hover:text-ink"
              >
                <Icon name="close" />
              </button>
            </div>
          )}

          {/* The page itself, set out like a manuscript: name and word count up top, title centered. */}
          <div className="card-raised px-5 py-8 transition-colors focus-within:border-line-strong sm:px-12 sm:py-12">
            <div className="flex justify-between gap-4 font-mono text-sm text-muted">
              <span className="truncate">{me?.name}</span>
              <span className="shrink-0 tabular-nums">{manuscriptCount}</span>
            </div>

            <label htmlFor="draft-title" className="sr-only">
              Title
            </label>
            <input
              id="draft-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-12 w-full bg-transparent text-center font-mono text-2xl font-bold text-ink outline-none placeholder:text-muted/70"
              placeholder="Untitled"
            />
            {me?.name && (
              <p className="mt-2 text-center font-mono text-muted">
                by {me.name}
              </p>
            )}

            <label htmlFor="draft-body" className="sr-only">
              Your writing
            </label>
            <textarea
              id="draft-body"
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              placeholder="Start writing your story, essay, poem, or review…"
              className="typescript mt-10 min-h-[58vh] w-full resize-y bg-transparent outline-none placeholder:text-muted/70"
            />
          </div>
        </section>

        <aside className="space-y-10 lg:pt-[3.75rem]">
          <section>
            <h2 className="text-base font-semibold text-ink">This draft</h2>
            <dl className="mt-3 divide-y divide-line border-y border-line text-[0.9375rem]">
              <div className="flex justify-between py-2">
                <dt className="text-ink-soft">Words</dt>
                <dd className="tabular-nums text-ink">
                  {wordCount.toLocaleString()}
                </dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-ink-soft">Reading time</dt>
                <dd className="tabular-nums text-ink">{readTime} min</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-ink-soft">Characters</dt>
                <dd className="tabular-nums text-ink">
                  {charCount.toLocaleString()}
                </dd>
              </div>
            </dl>
            <p className="mt-3 flex items-center gap-2 text-sm text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              {status}
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink">Genres</h2>
            <p className="mt-1 text-sm text-muted">Pick what fits your work.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => toggle(c)}
                  aria-pressed={genres.includes(c)}
                  className={cx("chip", genres.includes(c) && "chip-active")}
                >
                  {c}
                </button>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
