"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/shell";
import { Icon, PageHeader } from "@/components/ui";
import { IndexCard } from "@/components/IndexCard";

type Question = { word: string; answer: string; options: string[] };

export default function VocabPage() {
  const [queue, setQueue] = useState<Question[]>([]);
  const [current, setCurrent] = useState<Question | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);

  const [total, setTotal] = useState<number | null>(null);
  const [error, setError] = useState(false);

  const fetching = useRef(false);

  const fetchBatch = useCallback(async () => {
    if (fetching.current) return;
    fetching.current = true;
    try {
      const r = await fetch("/api/vocab/random?n=15", { cache: "no-store" });
      if (!r.ok) throw new Error();
      const j = await r.json();
      setTotal(j.count ?? null);
      setQueue((q) => q.concat(j.questions || []));
      setError(false);
    } catch {
      setError(true);
    } finally {
      fetching.current = false;
    }
  }, []);

  // Initial load.
  useEffect(() => { fetchBatch(); }, [fetchBatch]);

  // Pull the next card whenever we don't have one.
  useEffect(() => {
    if (!current && queue.length) {
      setCurrent(queue[0]);
      setQueue((q) => q.slice(1));
    }
  }, [current, queue]);

  // Keep the well topped up so "Next" is always instant.
  useEffect(() => {
    if (queue.length < 5) fetchBatch();
  }, [queue.length, fetchBatch]);

  function choose(opt: string) {
    if (revealed || !current) return;
    setSelected(opt);
    setAnswered((a) => a + 1);
    if (opt === current.answer) {
      setScore((s) => s + 1);
      setStreak((s) => {
        const n = s + 1;
        setBest((b) => Math.max(b, n));
        return n;
      });
    } else {
      setStreak(0);
    }
    setRevealed(true);
  }

  function next() {
    setSelected(null);
    setRevealed(false);
    if (queue.length) {
      setCurrent(queue[0]);
      setQueue((q) => q.slice(1));
    } else {
      setCurrent(null); // an effect fills it once the next batch lands
    }
  }

  const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

  return (
    <AppShell>
      <PageHeader
        title="Vocabulary"
        description="Guess what each word means. The cards are pulled from a dictionary of tens of thousands of English words, so you won’t run out."
      />

      <div className="max-w-2xl">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 text-[0.9375rem] text-muted">
          <span>{total ? `${total.toLocaleString()} words in the deck` : "Loading the dictionary…"}</span>
          <span className="flex gap-4 tabular-nums">
            {streak >= 2 && <span className="text-accent">{streak} in a row</span>}
            {best > 0 && <span>Best run {best}</span>}
            <span>Score {score} / {answered}</span>
          </span>
        </div>

        {error && !current ? (
          <div className="border-t-2 border-ink py-8">
            <p className="text-xl font-semibold text-ink">Couldn’t load the dictionary</p>
            <button onClick={fetchBatch} className="btn-primary mt-4 px-5">Try again</button>
          </div>
        ) : (
          <>
            <IndexCard label="What does this word mean?" cardKey={current?.word} linesClassName="pb-[2.3rem] pt-[3.2rem] text-center">
              {/* Two ruled lines tall, so the word sits on a rule. */}
              {current ? (
                <h2 className="break-words font-mono text-[2.25rem] font-bold leading-[4rem] tracking-normal text-ink">{current.word}</h2>
              ) : (
                <div className="mx-auto my-[1.25rem] h-9 w-48 animate-pulse rounded bg-surface-sunken" aria-hidden />
              )}
            </IndexCard>

            {!current ? (
              <div className="mt-6 grid gap-2.5" aria-hidden>
                {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 animate-pulse rounded bg-surface-sunken" />)}
              </div>
            ) : (
              <>
                <div className="mt-6 grid gap-2.5">
                  {current.options.map((opt) => {
                    const isCorrect = revealed && opt === current.answer;
                    const isWrong = revealed && selected === opt && !isCorrect;
                    const cls = isCorrect
                      ? "border-success/60 bg-success/10 text-success"
                      : isWrong
                      ? "border-danger/60 bg-danger/10 text-danger"
                      : revealed
                      ? "border-line text-ink-soft opacity-60"
                      : "border-line-strong text-ink hover:border-ink-soft hover:bg-surface-sunken";
                    return (
                      <button
                        key={opt}
                        onClick={() => choose(opt)}
                        disabled={revealed}
                        className={`flex min-h-14 items-center justify-between gap-3 rounded border px-4 py-3 text-left leading-6 transition-colors duration-150 disabled:cursor-default ${cls}`}
                      >
                        <span>{cap(opt)}</span>
                        {isCorrect && <Icon name="check" size={18} />}
                        {isWrong && <Icon name="close" size={18} />}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-ink-soft" aria-live="polite">
                    {revealed ? (selected === current.answer ? "Nicely done." : `It’s “${cap(current.answer)}.”`) : "Choose the closest meaning."}
                  </p>
                  <button onClick={next} disabled={!revealed} className={revealed ? "btn-primary px-5" : "btn-secondary px-5"}>
                    Next word <Icon name="arrow" size={15} />
                  </button>
                </div>
              </>
            )}
          </>
        )}

        <p className="mt-10 text-sm text-muted">Definitions from Webster’s 1913 (public domain).</p>
      </div>
    </AppShell>
  );
}
