"use client";
import React, { useEffect, useState } from "react";
import { AppShell } from "@/components/shell";
import { PageHeader, Notice } from "@/components/ui";
import { useLiveRoom } from "@/lib/live-client";
export default function SharedDraft() {
  const { snapshot, error, connected, busy, act } = useLiveRoom("doc");
  const s = snapshot?.state?.kind === "doc" ? snapshot.state : null;
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [revision, setRevision] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [share, setShare] = useState("");
  const conflict = !!s && dirty && revision !== s.revision;
  useEffect(() => {
    if (s && !dirty) {
      setTitle(s.title);
      setText(s.text);
      setRevision(s.revision);
    }
  }, [s, dirty]);
  async function save() {
    const result = await act(s ? "save" : "create", { title, text, revision });
    if (result) {
      setDirty(false);
      if (result.room) {
        const link = `${location.origin}/collaborate?room=${encodeURIComponent(result.room)}`;
        setShare(link);
        history.replaceState(null, "", link);
      }
    }
  }
  return (
    <AppShell>
      <PageHeader
        title="Write together"
        description="Create a shared draft and send its link to a writing partner."
      />
      {error && <Notice tone="danger">{error}</Notice>}
      {conflict && (
        <Notice tone="info">
          Your partner saved a newer version. Your writing is still here. Review
          their version below before replacing it.
        </Notice>
      )}
      <div className="max-w-4xl space-y-4">
        <input
          aria-label="Shared draft title"
          className="field"
          maxLength={200}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setDirty(true);
          }}
          placeholder="Title"
        />
        <textarea
          aria-label="Shared writing"
          className="field typescript min-h-[50vh]"
          maxLength={100000}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setDirty(true);
          }}
          placeholder="Write together…"
        />
        <div className="flex gap-3">
          <button
            onClick={save}
            disabled={!connected || busy || conflict}
            className="btn-primary"
          >
            {s ? "Save shared draft" : "Create shared draft"}
          </button>
          {s && (
            <button
              className="btn-secondary"
              onClick={() =>
                setShare(
                  `${location.origin}/collaborate?room=${encodeURIComponent(snapshot!.room!)}`,
                )
              }
            >
              Share draft link
            </button>
          )}
        </div>
        <p className="text-sm text-muted">
          {s
            ? `Version ${s.revision} · ${dirty ? "You have unsaved changes" : "Saved and shared"}`
            : "Create the draft before inviting a partner."}
        </p>
        {share && (
          <>
            <label htmlFor="doc-invite" className="text-sm">
              Anyone with this link can join this draft. Share it only with your
              writing partners.
            </label>
            <input
              id="doc-invite"
              readOnly
              value={share}
              onFocus={(e) => e.target.select()}
              className="field"
            />
          </>
        )}
        {conflict && (
          <div className="card p-5">
            <h2 className="font-semibold">Your partner’s saved version</h2>
            <h3 className="mt-3">{s!.title}</h3>
            <p className="mt-3 whitespace-pre-wrap break-words font-mono">
              {s!.text}
            </p>
            <button
              className="btn-secondary mt-4"
              onClick={() => {
                setDirty(false);
                setTitle(s!.title);
                setText(s!.text);
                setRevision(s!.revision);
              }}
            >
              Use this version
            </button>
            <button
              className="btn-secondary mt-4 ml-3"
              onClick={() => setRevision(s!.revision)}
            >
              Keep my version for the next save
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
