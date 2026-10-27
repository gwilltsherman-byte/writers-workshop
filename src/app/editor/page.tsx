"use client";

import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { AppShell } from "@/components/shell";
import { cx, Icon, Modal, Notice } from "@/components/ui";
import { useAuth } from "@/contexts/auth";
import {
  readDraft,
  writeDraft,
  draftBackup,
  parseDraftBackup,
} from "../../../public/draft-storage.js";

type Draft = { title: string; html: string; genres: string[] };
type SaveState = "opening" | "ready" | "saved" | "error" | "unreadable";
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
const saveLabels: Record<SaveState, string> = {
  opening: "Opening your draft…",
  ready: "Your writing will save on this device",
  saved: "Saved on this device",
  error: "Not saved · download a backup",
  unreadable: "Saved draft could not be opened",
};

function downloadFile(contents: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function sizeTitle(field: HTMLTextAreaElement) {
  field.style.height = "auto";
  field.style.height = `${field.scrollHeight}px`;
}

export default function EditorPage() {
  const { me, hydrated } = useAuth();
  const [title, setTitle] = useState("");
  const [html, setHtml] = useState("");
  const [genres, setGenres] = useState<string[]>([]);
  const [saveState, setSaveState] = useState<SaveState>("opening");
  const [publishing, setPublishing] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [restoreDraft, setRestoreDraft] = useState<Draft | null>(null);
  const [notice, setNotice] = useState<{
    tone: "success" | "danger";
    text: React.ReactNode;
  } | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string | null>(null);
  const backupInput = useRef<HTMLInputElement>(null);
  const titleInput = useRef<HTMLTextAreaElement>(null);
  const bodyInput = useRef<HTMLTextAreaElement>(null);
  const canEdit = saveState !== "opening" && saveState !== "unreadable";
  const wordCount = useMemo(
    () => html.trim().split(/\s+/).filter(Boolean).length,
    [html],
  );
  const hasWriting = !!html.trim();
  const canPublish = !!title.trim() && hasWriting && hydrated;

  useLayoutEffect(() => {
    if (titleInput.current) sizeTitle(titleInput.current);
  }, [title, focused]);

  useEffect(() => {
    const field = titleInput.current;
    if (!field) return;
    let width = field.clientWidth;
    let cancelled = false;
    const observer = new ResizeObserver(() => {
      if (field.clientWidth !== width) {
        width = field.clientWidth;
        sizeTitle(field);
      }
    });
    observer.observe(field);
    void document.fonts.ready.then(() => {
      if (!cancelled) sizeTitle(field);
    });
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    try {
      const draft = readDraft(localStorage);
      setTitle(draft.title);
      setHtml(draft.html);
      setGenres(draft.genres);
      setSaveState(
        draft.title || draft.html || draft.genres.length ? "saved" : "ready",
      );
    } catch {
      setSaveState("unreadable");
    }
    const pickedPrompt = new URLSearchParams(window.location.search).get(
      "prompt",
    );
    if (pickedPrompt) setPrompt(pickedPrompt.slice(0, 500));
  }, []);

  useEffect(() => {
    if (saveState !== "error") return;
    const protectUnsavedDraft = (event: BeforeUnloadEvent) =>
      event.preventDefault();
    window.addEventListener("beforeunload", protectUnsavedDraft);
    return () =>
      window.removeEventListener("beforeunload", protectUnsavedDraft);
  }, [saveState]);

  useEffect(() => {
    if (!focused) return;
    bodyInput.current?.focus({ preventScroll: true });
    const leaveFocus = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !publishOpen && !restoreDraft)
        setFocused(false);
    };
    window.addEventListener("keydown", leaveFocus);
    return () => window.removeEventListener("keydown", leaveFocus);
  }, [focused, publishOpen, restoreDraft]);

  function saveChange(next: Draft) {
    try {
      writeDraft(localStorage, next);
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }

  function downloadBackup() {
    downloadFile(
      JSON.stringify(draftBackup({ title, html, genres }), null, 2),
      "workshop-draft-backup.json",
      "application/json",
    );
  }

  function exportText() {
    const filename =
      (title.trim() || "untitled-draft")
        .replace(/[^a-z0-9\s_-]/gi, "")
        .trim()
        .replace(/\s+/g, "-")
        .slice(0, 80) || "draft";
    downloadFile(
      `${title.trim() || "Untitled"}\n\n${html}`,
      `${filename}.txt`,
      "text/plain;charset=utf-8",
    );
  }

  async function chooseBackup(file: File | undefined) {
    if (!file) return;
    setNotice(null);
    try {
      if (file.size > 2_000_000)
        throw new Error(
          "This backup is too large. Choose a file smaller than 2 MB.",
        );
      setRestoreDraft(parseDraftBackup(await file.text()));
    } catch (error) {
      setNotice({
        tone: "danger",
        text:
          error instanceof SyntaxError
            ? "This file is not a readable backup. Choose a Writers’ Workshop JSON backup."
            : error instanceof Error
              ? error.message
              : "Could not read that backup. Choose a Writers’ Workshop JSON backup.",
      });
    }
  }

  function confirmRestore() {
    if (!restoreDraft) return;
    try {
      writeDraft(localStorage, restoreDraft);
      setTitle(restoreDraft.title);
      setHtml(restoreDraft.html);
      setGenres(restoreDraft.genres);
      setSaveState("saved");
      setRestoreDraft(null);
      setNotice({
        tone: "success",
        text: "Backup restored. This draft is now saved on your device.",
      });
    } catch {
      setRestoreDraft(null);
      setNotice({
        tone: "danger",
        text: "Your browser could not save the backup. Your current draft has not been replaced. Free up browser storage and try again.",
      });
    }
  }

  function dismissPrompt() {
    setPrompt(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("prompt");
    window.history.replaceState(null, "", url);
  }

  async function publish() {
    if (!canPublish || !me || publishing) return;
    setPublishError(null);
    setPublishing(true);
    try {
      const response = await fetch("/api/stories", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), html, genres }),
      });
      const result = await response.json().catch(() => ({}));
      if (response.status === 401)
        throw new Error(
          "Your session has ended. Sign in again to publish; your draft is still here.",
        );
      if (!response.ok)
        throw new Error(
          "Your story could not be published. Check your connection and try again. Your draft is still here.",
        );
      setPublishOpen(false);
      setNotice({
        tone: "success",
        text: (
          <>
            {result?.id ? (
              <>
                Your story is published.{" "}
                <Link href={`/stories/${result.id}`} className="underline">
                  Read your story
                </Link>
                .
              </>
            ) : (
              "Your story is published in Stories."
            )}{" "}
            Your draft remains on this device.
          </>
        ),
      });
    } catch (error) {
      setPublishError(
        error instanceof Error
          ? error.message
          : "Publishing didn’t work. Your draft is still here; try again when connected.",
      );
    } finally {
      setPublishing(false);
    }
  }

  function toggleGenre(genre: string) {
    const next = genres.includes(genre)
      ? genres.filter((value) => value !== genre)
      : [...genres, genre];
    setGenres(next);
    saveChange({ title, html, genres: next });
  }

  return (
    <AppShell focus={focused}>
      <div className={cx("mx-auto", focused && "max-w-4xl")}>
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
          <div>
            <h1 className="font-serif text-2xl font-semibold">
              {focused ? "Just the words." : "Writing desk"}
            </h1>
            <p
              aria-live="polite"
              className={cx(
                "mt-2 flex items-center gap-2 text-sm",
                saveState === "error" || saveState === "unreadable"
                  ? "text-danger"
                  : "text-muted",
              )}
            >
              {saveState === "saved" && <Icon name="check" size={14} />}
              {saveLabels[saveState]}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="btn-secondary"
              aria-pressed={focused}
              onClick={() => setFocused((value) => !value)}
              disabled={!canEdit}
            >
              {focused ? "Exit focus" : "Focus on writing"}
            </button>
            {!focused && (
              <button
                className="btn-accent"
                disabled={!canPublish}
                onClick={() => {
                  setPublishError(null);
                  setPublishOpen(true);
                }}
              >
                Review & publish <Icon name="arrow" />
              </button>
            )}
          </div>
        </div>

        {notice && (
          <div className="mb-5">
            <Notice tone={notice.tone}>{notice.text}</Notice>
          </div>
        )}
        {saveState === "unreadable" && (
          <div className="mb-5">
            <Notice tone="danger">
              The saved draft could not be opened. Its original copy is kept
              untouched. Restore a backup below to recover your writing.
            </Notice>
          </div>
        )}
        {saveState === "error" && (
          <div className="mb-5">
            <Notice tone="danger">
              This browser could not save your latest changes.{" "}
              <button
                onClick={downloadBackup}
                className="font-semibold underline"
              >
                Download a backup
              </button>{" "}
              before leaving this page.
            </Notice>
          </div>
        )}

        <div
          className={cx(
            "grid gap-8 lg:gap-10",
            !focused && "lg:grid-cols-[minmax(0,1fr)_14.5rem]",
          )}
        >
          <section className="min-w-0" aria-label="Your manuscript">
            {prompt && (
              <div className="mb-5 flex items-start gap-3 border-y border-line bg-surface-sunken px-4 py-3">
                <p className="flex-1 text-sm leading-6 text-ink-soft">
                  <span className="font-medium text-ink">
                    A starting point.
                  </span>{" "}
                  {prompt}
                </p>
                <button
                  onClick={dismissPrompt}
                  aria-label="Dismiss writing prompt"
                  className="btn-ghost -mr-2 -mt-1 h-11 w-11 shrink-0 p-0"
                >
                  <Icon name="close" />
                </button>
              </div>
            )}

            <div className="border border-line bg-surface-raised px-5 py-7 sm:px-10 sm:py-9">
              <div className="flex min-w-0 justify-between gap-4 border-b border-line pb-4 font-mono text-xs text-muted sm:text-sm">
                <span className="truncate">
                  {me?.name || "Private manuscript"}
                </span>
                <span className="shrink-0 tabular-nums">
                  {wordCount.toLocaleString()}{" "}
                  {wordCount === 1 ? "word" : "words"}
                </span>
              </div>
              <label htmlFor="draft-title" className="sr-only">
                Draft title
              </label>
              <textarea
                ref={titleInput}
                id="draft-title"
                rows={1}
                maxLength={500}
                value={title}
                disabled={!canEdit}
                onChange={(event) => {
                  const nextTitle = event.target.value.replace(/[\r\n]+/g, " ");
                  setTitle(nextTitle);
                  saveChange({ title: nextTitle, html, genres });
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.nativeEvent.isComposing)
                    event.preventDefault();
                }}
                className="mt-9 block w-full resize-none overflow-hidden bg-transparent py-2 font-mono text-2xl font-bold leading-snug text-ink [overflow-wrap:anywhere] placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:opacity-60 sm:text-3xl sm:leading-snug"
                placeholder="Give it a title"
              />
              <label htmlFor="draft-body" className="sr-only">
                Your writing
              </label>
              <textarea
                ref={bodyInput}
                id="draft-body"
                maxLength={1000000}
                value={html}
                disabled={!canEdit}
                onChange={(event) => {
                  setHtml(event.target.value);
                  saveChange({ title, html: event.target.value, genres });
                }}
                placeholder="Begin with a sentence. See where it takes you."
                aria-describedby="draft-privacy"
                className="typescript mt-6 min-h-[56vh] w-full resize-y bg-transparent py-2 placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:opacity-60"
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4 text-xs text-muted">
                <p id="draft-privacy">Private until you choose to share.</p>
                <span className="tabular-nums">
                  {wordCount > 0
                    ? `${Math.max(1, Math.ceil(wordCount / 220))} min read`
                    : "One sentence is a start."}
                </span>
              </div>
            </div>
            {!focused && (
              <p className="mt-3 text-xs leading-5 text-muted">
                This desk holds one draft in this browser. A backup keeps a copy
                you can restore on another device.
              </p>
            )}
          </section>

          {!focused && (
            <aside className="space-y-7" aria-label="Draft tools">
              <section>
                <h2 className="font-serif text-xl font-semibold">
                  Shape the piece
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Choose the genres that fit. You can change them as you write.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {categories.map((genre) => (
                    <button
                      key={genre}
                      onClick={() => toggleGenre(genre)}
                      disabled={!canEdit}
                      aria-pressed={genres.includes(genre)}
                      className={cx(
                        "chip min-h-11 disabled:cursor-not-allowed disabled:opacity-50",
                        genres.includes(genre) && "chip-active",
                      )}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              </section>
              <section className="border-t border-line pt-6">
                <h2 className="font-serif text-xl font-semibold">
                  Invite another eye
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Take an excerpt to a critique room, or start a shared draft
                  with a partner.
                </p>
                <div className="mt-3 flex flex-col items-start gap-1">
                  {hasWriting && saveState === "saved" ? (
                    <Link
                      href="/critique/short?draft=1"
                      className="link-accent inline-flex min-h-11 items-center gap-2"
                    >
                      Get feedback <Icon name="arrow" />
                    </Link>
                  ) : (
                    <span className="py-3 text-sm text-muted">
                      {saveState === "error"
                        ? "Save your draft to bring it to critique."
                        : "Write a passage to bring to critique."}
                    </span>
                  )}
                  <Link
                    href="/collaborate"
                    className="link-accent inline-flex min-h-11 items-center gap-2"
                  >
                    Write together <Icon name="arrow" />
                  </Link>
                </div>
              </section>
              <section className="border-t border-line pt-6">
                <h2 className="font-serif text-xl font-semibold">
                  Keep a copy
                </h2>
                <div className="mt-3 flex flex-col items-stretch gap-2">
                  <button
                    onClick={downloadBackup}
                    disabled={!canEdit}
                    className="btn-secondary"
                  >
                    Download backup
                  </button>
                  <button
                    onClick={exportText}
                    disabled={!canEdit || !hasWriting}
                    className="btn-secondary"
                  >
                    Export as text
                  </button>
                  <button
                    onClick={() => backupInput.current?.click()}
                    disabled={saveState === "opening"}
                    className="btn-ghost"
                  >
                    Restore a backup
                  </button>
                </div>
                <input
                  ref={backupInput}
                  className="hidden"
                  tabIndex={-1}
                  aria-label="Choose a draft backup"
                  type="file"
                  accept=".json,application/json"
                  onChange={(event) => {
                    void chooseBackup(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />
              </section>
              {hydrated && !me && (
                <p className="border-t border-line pt-5 text-sm leading-6 text-muted">
                  You’re writing as a guest.{" "}
                  <Link href="/auth" className="link-accent">
                    Sign in
                  </Link>{" "}
                  when you’re ready to publish.
                </p>
              )}
            </aside>
          )}
        </div>
      </div>

      <Modal
        open={publishOpen}
        onClose={() => {
          if (!publishing) setPublishOpen(false);
        }}
        title="Ready for readers?"
      >
        <p className="text-sm leading-6 text-ink-soft">
          Publishing adds a public story under your name. Your private draft
          stays on this device.
        </p>
        <div className="my-5 border-y border-line py-4">
          <h3 className="break-words font-serif text-xl font-semibold">
            {title}
          </h3>
          <p className="mt-1 text-sm text-muted">
            {me ? `By ${me.name} · ` : ""}
            {wordCount.toLocaleString()} words
            {genres.length ? ` · ${genres.join(", ")}` : ""}
          </p>
          <p className="mt-3 line-clamp-4 whitespace-pre-wrap break-words font-mono text-sm leading-6 text-ink-soft">
            {html}
          </p>
        </div>
        {publishError && (
          <div className="mb-4">
            <Notice tone="danger">
              {publishError}{" "}
              {publishError.includes("session") && (
                <Link className="underline" href="/auth">
                  Sign in
                </Link>
              )}
            </Notice>
          </div>
        )}
        {me ? (
          <div className="flex flex-wrap justify-end gap-2">
            <button
              className="btn-secondary"
              disabled={publishing}
              onClick={() => setPublishOpen(false)}
            >
              Keep editing
            </button>
            <button
              className="btn-accent"
              disabled={publishing || !canPublish}
              onClick={() => void publish()}
            >
              {publishing ? "Publishing…" : "Publish story"}
            </button>
          </div>
        ) : (
          <div>
            <p className="mb-4 text-sm leading-6 text-muted">
              Sign in to publish this story. Your draft will be waiting when you
              return.
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                onClick={() => setPublishOpen(false)}
                className="btn-secondary"
              >
                Keep editing
              </button>
              <Link href="/auth" className="btn-accent">
                Sign in to publish
              </Link>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!restoreDraft}
        onClose={() => setRestoreDraft(null)}
        title="Replace this draft?"
      >
        <p className="text-sm leading-6 text-ink-soft">
          This will replace the draft on this device with{" "}
          <strong className="break-words text-ink">
            {restoreDraft?.title || "Untitled"}
          </strong>
          . Download your current draft first if you want to keep both.
        </p>
        {canEdit && (
          <button
            className="link-accent mt-3 min-h-11"
            onClick={downloadBackup}
          >
            Download current draft
          </button>
        )}
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            className="btn-secondary"
            onClick={() => setRestoreDraft(null)}
          >
            Keep current draft
          </button>
          <button className="btn-accent" onClick={confirmRestore}>
            Replace with backup
          </button>
        </div>
      </Modal>
    </AppShell>
  );
}
