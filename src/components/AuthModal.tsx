"use client";
import React, { useEffect, useState } from "react";
import { Icon } from "@/components/ui";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="text-sm text-muted">{hint}</span>}
    </label>
  );
}

type Mode = "login" | "login-verify" | "signup" | "signup-verify";

export default function AuthModal({
  onClose,
  onAuth,
}: {
  onClose?: () => void;
  onAuth?: (name?: string) => void;
}) {
  const [mode, setMode] = useState<Mode>("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);

  useEffect(() => setError(null), [mode]);

  function announceAuth() {
    try {
      window.dispatchEvent(new Event("ww-auth-change"));
    } catch {}
  }

  async function post(path: string, payload: unknown) {
    const r = await fetch(path, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j?.error || "Something went wrong.");
    return j;
  }

  async function submitLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const j = await post("/api/auth/login", { email, password });
      onAuth?.(j.name || "");
      announceAuth();
      onClose?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function submitSignup(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (!name || !email || !password)
        throw new Error("All fields are required.");
      if (password !== password2) throw new Error("Passwords do not match.");
      const j = await post("/api/auth/signup", { email, name, password });
      if (j.devCode) setDevCode(j.devCode);
      setMode("signup-verify");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function submitSignupVerify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const j = await post("/api/auth/verify", { email, code, name, password });
      onAuth?.(j.name || "");
      announceAuth();
      onClose?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const loginActive = mode === "login" || mode === "login-verify";
  const signupActive = mode === "signup" || mode === "signup-verify";

  const tab = (id: "login" | "signup", label: string) => {
    const active =
      (id === "login" && loginActive) || (id === "signup" && signupActive);
    return (
      <button
        onClick={() => setMode(id)}
        type="button"
        aria-pressed={active}
        className={`min-h-11 flex-1 border-b-2 px-3 text-[0.9375rem] transition-colors duration-150 ${
          active
            ? "border-accent text-ink"
            : "border-transparent text-muted hover:text-ink"
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        className="relative w-full max-w-md overflow-hidden rounded border border-line bg-surface-raised shadow-lift"
      >
        <div className="flex items-center justify-between pl-6 pr-3 pt-4">
          <h2 id="auth-title" className="text-2xl font-semibold text-ink">
            {loginActive ? "Welcome back" : "Create your account"}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-11 w-11 place-items-center rounded text-muted transition-colors hover:bg-surface-sunken hover:text-ink"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="mx-6 mt-3 flex border-b border-line">
          {tab("login", "Log in")}
          {tab("signup", "Sign up")}
        </div>

        <div className="px-6 pb-6 pt-5">
          {error && (
            <div
              role="alert"
              className="mb-4 rounded border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-[0.9375rem] text-danger"
            >
              {String(error)}
            </div>
          )}

          {mode === "login" && (
            <form onSubmit={submitLogin} className="space-y-4">
              <Field label="Email">
                <input
                  className="field"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field label="Password">
                <input
                  className="field"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>
              <button disabled={busy} className="btn-primary mt-2 w-full">
                {busy ? "Signing in…" : "Continue"}
              </button>
            </form>
          )}

          {mode === "signup" && (
            <form onSubmit={submitSignup} className="space-y-4">
              <Field label="Display name" hint="Shown on anything you publish.">
                <input
                  className="field"
                  autoComplete="nickname"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>
              <Field label="Email">
                <input
                  className="field"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field label="Password">
                <input
                  className="field"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>
              <Field label="Confirm password">
                <input
                  className="field"
                  type="password"
                  autoComplete="new-password"
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                />
              </Field>
              <button disabled={busy} className="btn-primary mt-2 w-full">
                {busy ? "Sending code…" : "Send verification code"}
              </button>
            </form>
          )}

          {mode === "signup-verify" && (
            <form onSubmit={submitSignupVerify} className="space-y-3">
              {devCode && (
                <div className="rounded border border-line-strong bg-surface-sunken px-3.5 py-2.5 text-[0.9375rem] text-ink">
                  Dev code:{" "}
                  <span className="font-mono font-semibold">{devCode}</span>
                </div>
              )}
              <p className="text-sm text-ink-soft">
                Enter the 6-digit code we sent to{" "}
                <span className="font-medium text-ink">{email}</span>.
              </p>
              <input
                aria-label="Verification code"
                inputMode="numeric"
                autoComplete="one-time-code"
                className="field text-center font-mono text-lg tracking-[0.4em]"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="btn-secondary flex-1"
                >
                  Back
                </button>
                <button disabled={busy} className="btn-primary flex-1">
                  {busy ? "Verifying…" : "Verify & continue"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
