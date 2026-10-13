"use client";
import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/shell";
import { PageHeader, Notice } from "@/components/ui";
import { useAuth } from "@/contexts/auth";

export default function SettingsPage() {
  const { me, hydrated, refresh } = useAuth();
  const [curPwd, setCurPwd] = React.useState("");
  const [newPwd, setNewPwd] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [emailCode, setEmailCode] = React.useState("");
  const [msg, setMsg] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => { if (me?.email) setEmail(me.email); }, [me?.email]);

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg(null); setErr(null);
    const r = await fetch("/api/account/change-password", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ currentPassword: curPwd, newPassword: newPwd }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return setErr(j?.error || "Failed");
    setMsg("Password updated."); setCurPwd(""); setNewPwd("");
  };
  const requestEmail = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg(null); setErr(null);
    const r = await fetch("/api/account/request-email-change", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ newEmail: email }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return setErr(j?.error || "Failed");
    setMsg(j?.devCode ? `Dev code: ${j.devCode}` : "We sent a code to your new email.");
  };
  const confirmEmail = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg(null); setErr(null);
    const r = await fetch("/api/account/confirm-email-change", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ newEmail: email, code: emailCode }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return setErr(j?.error || "Failed");
    setMsg("Email updated."); setEmailCode(""); await refresh();
  };

  if (hydrated && !me) {
    return (
      <AppShell>
        <div className="max-w-xl py-12">
          <h1 className="text-title font-semibold text-ink">You’re signed out</h1>
          <p className="mt-3 text-lg text-ink-soft">Sign in to manage your account settings.</p>
          <Link href="/auth" className="btn-accent mt-6 inline-flex px-5">Log in</Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader title="Settings" description="Manage your password and email address." />

      {err && <div className="mb-4"><Notice tone="danger">{err}</Notice></div>}
      {msg && <div className="mb-4"><Notice tone="success">{msg}</Notice></div>}

      <div className="grid gap-6 md:grid-cols-2">
        <form onSubmit={changePassword} className="card p-6">
          <h2 className="font-serif text-lg font-semibold text-ink">Change password</h2>
          <p className="mt-1 text-sm text-muted">Use at least 8 characters.</p>
          <div className="mt-5 space-y-3">
            <label className="grid gap-1.5">
              <span className="label">Current password</span>
              <input type="password" autoComplete="current-password" value={curPwd} onChange={(e) => setCurPwd(e.target.value)} className="field" />
            </label>
            <label className="grid gap-1.5">
              <span className="label">New password</span>
              <input type="password" autoComplete="new-password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} className="field" />
            </label>
          </div>
          <button className="btn-primary mt-5 px-5">Update password</button>
        </form>

        <form onSubmit={requestEmail} className="card p-6">
          <h2 className="font-serif text-lg font-semibold text-ink">Change email</h2>
          <p className="mt-1 text-sm text-muted">We’ll send a 6-digit code to confirm.</p>
          <div className="mt-5 space-y-3">
            <label className="grid gap-1.5">
              <span className="label">New email address</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field" />
            </label>
            <div className="flex flex-wrap gap-2">
              <button className="btn-primary px-4" type="submit">Send code</button>
              <input aria-label="6-digit code" inputMode="numeric" autoComplete="one-time-code" placeholder="6-digit code" value={emailCode} onChange={(e) => setEmailCode(e.target.value)} className="field min-w-[8rem] flex-1" />
              <button onClick={confirmEmail} className="btn-secondary px-4" type="button">Confirm</button>
            </div>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
