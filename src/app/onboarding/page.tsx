"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/shell";
import { PageHeader } from "@/components/ui";
import AuthModal from "@/components/AuthModal";
import { CURATED_STORIES } from "@/data/curatedStories";

type Story = { id: string; title: string; excerpt?: string; genres: string[]; authorName: string };

export default function Onboarding() {
  const [authed, setAuthed] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  useEffect(() => { try { setAuthed(localStorage.getItem("authed") === "1"); } catch {} }, []);

  const router = useRouter();
  const [rows, setRows] = useState<Story[]>([]);
  const [pick, setPick] = useState<Record<string, boolean>>({});
  useEffect(() => {
    if (!authed) return;
    setRows(CURATED_STORIES.map((c: any, i: number) => ({ id: `curated-${i}`, title: c.title, excerpt: c.excerpt, genres: c.genres, authorName: c.authorName })));
  }, [authed]);

  const count = Object.values(pick).filter(Boolean).length;
  const submit = async () => { localStorage.setItem("onboarded", "1"); router.push("/explore"); };

  return (
    <AppShell>
      <PageHeader title="Personalize your feed" description="Pick a few stories you like and we’ll use them to shape what you see in Explore." />

      {!authed ? (
        <div className="border-t-2 border-ink pt-6">
          <h2 className="text-2xl font-semibold text-ink">Sign in to continue</h2>
          <p className="mt-2 text-ink-soft">You’ll need an account so we can remember what you picked.</p>
          <button onClick={() => setShowAuth(true)} className="btn-accent mt-6 px-6">Log in or sign up</button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((s) => {
              const active = !!pick[s.id];
              return (
                <button
                  key={s.id}
                  onClick={() => setPick((p) => ({ ...p, [s.id]: !p[s.id] }))}
                  aria-pressed={active}
                  className={`rounded border p-5 text-left transition-colors duration-150 ${active ? "border-accent bg-accent-soft" : "border-line bg-surface hover:border-line-strong"}`}
                >
                  <div className="text-sm italic text-muted">{s.genres.join(", ")}</div>
                  <div className="mt-1 font-serif text-lg font-semibold text-ink">{s.title}</div>
                  <div className="mt-1 line-clamp-2 text-sm text-ink-soft">{s.excerpt || ""}</div>
                  <div className="mt-2 text-sm text-muted">by {s.authorName}</div>
                </button>
              );
            })}
          </div>
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-muted">{count < 5 ? `Pick ${5 - count} more to continue` : "That’s enough to go on."}</div>
            <button disabled={count < 5} onClick={submit} className="btn-accent px-6">Show me stories</button>
          </div>
        </>
      )}

      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onAuth={() => { setShowAuth(false); try { localStorage.setItem("authed", "1"); } catch {} setAuthed(true); }}
        />
      )}
    </AppShell>
  );
}
