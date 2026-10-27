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
  const [busy, setBusy] = React.useState<
    "password" | "request" | "confirm" | null
  >(null);
  const [codeSent, setCodeSent] = React.useState(false);

  React.useEffect(() => {
    if (me?.email) setEmail(me.email);
  }, [me?.email]);

  async function post(path: string, payload: unknown) {
    const r = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok)
      throw new Error(
        j?.error || "Your change could not be saved. Please try again.",
      );
    return j;
  }
  async function update(
    kind: "password" | "request" | "confirm",
    action: () => Promise<void>,
  ) {
    if (busy) return;
    setBusy(kind);
    setMsg(null);
    setErr(null);
    try {
      await action();
    } catch (error) {
      setErr(
        error instanceof TypeError
          ? "Could not connect. Check your connection and try again."
          : (error as Error).message,
      );
    } finally {
      setBusy(null);
    }
  }
  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    await update("password", async () => {
      await post("/api/account/change-password", {
        currentPassword: curPwd,
        newPassword: newPwd,
      });
      setMsg("Password updated.");
      setCurPwd("");
      setNewPwd("");
    });
  };
  const requestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    await update("request", async () => {
      const j = await post("/api/account/request-email-change", {
        newEmail: email,
      });
      setCodeSent(true);
      setMsg(
        j?.devCode
          ? `Local preview code: ${j.devCode}. No email was sent.`
          : `We sent a code to ${email}.`,
      );
    });
  };
  const confirmEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    await update("confirm", async () => {
      await post("/api/account/confirm-email-change", {
        newEmail: email,
        code: emailCode,
      });
      setMsg("Email updated.");
      setEmailCode("");
      setCodeSent(false);
      await refresh();
    });
  };

  if (!hydrated)
    return (
      <AppShell>
        <p role="status" className="py-12 text-muted">
          Loading your account…
        </p>
      </AppShell>
    );

  if (hydrated && !me) {
    return (
      <AppShell>
        <div className="max-w-xl py-12">
          <h1 className="text-title font-semibold text-ink">
            You’re signed out
          </h1>
          <p className="mt-3 text-lg text-ink-soft">
            Sign in to manage your account settings.
          </p>
          <Link href="/auth" className="btn-accent mt-6 inline-flex px-5">
            Log in
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="Settings"
        description="Manage your password and email address."
      />

      {err && (
        <div className="mb-4">
          <Notice tone="danger">{err}</Notice>
        </div>
      )}
      {msg && (
        <div className="mb-4">
          <Notice tone="success">{msg}</Notice>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <form
          onSubmit={changePassword}
          className="card min-w-0 p-6"
          aria-busy={busy === "password"}
        >
          <h2 className="font-serif text-lg font-semibold text-ink">
            Change password
          </h2>
          <p className="mt-1 text-sm text-muted">Use at least 8 characters.</p>
          <div className="mt-5 space-y-3">
            <label className="grid gap-1.5">
              <span className="label">Current password</span>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={curPwd}
                onChange={(e) => setCurPwd(e.target.value)}
                className="field"
              />
            </label>
            <label className="grid gap-1.5">
              <span className="label">New password</span>
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                className="field"
              />
            </label>
          </div>
          <button disabled={!!busy} className="btn-primary mt-5 px-5">
            {busy === "password" ? "Updating…" : "Update password"}
          </button>
        </form>

        <section className="card min-w-0 p-6">
          <h2 className="font-serif text-lg font-semibold text-ink">
            Change email
          </h2>
          <p className="mt-1 text-sm text-muted">
            We’ll send a 6-digit code to confirm.
          </p>
          <form
            onSubmit={requestEmail}
            className="mt-5 space-y-3"
            aria-busy={busy === "request"}
          >
            <label className="grid gap-1.5">
              <span className="label">New email address</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setCodeSent(false);
                  setEmailCode("");
                }}
                className="field"
              />
            </label>
            <button
              disabled={!!busy || email.trim().toLowerCase() === me?.email}
              className="btn-primary px-4"
              type="submit"
            >
              {busy === "request"
                ? "Sending…"
                : codeSent
                  ? "Send a new code"
                  : "Send verification code"}
            </button>
          </form>
          {codeSent && (
            <form
              onSubmit={confirmEmail}
              className="mt-5 space-y-3 border-t border-line pt-5"
              aria-busy={busy === "confirm"}
            >
              <label className="grid gap-1.5">
                <span className="label">Verification code</span>
                <input
                  required
                  pattern="[0-9]{6}"
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="6-digit code"
                  value={emailCode}
                  onChange={(e) =>
                    setEmailCode(e.target.value.replace(/\D/g, ""))
                  }
                  className="field"
                />
              </label>
              <button
                disabled={!!busy}
                className="btn-secondary px-4"
                type="submit"
              >
                {busy === "confirm" ? "Confirming…" : "Confirm new email"}
              </button>
            </form>
          )}
        </section>
      </div>
    </AppShell>
  );
}
