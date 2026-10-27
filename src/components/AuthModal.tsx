"use client";
import React, { useEffect, useState } from "react";
import { Modal } from "@/components/ui";

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

type Mode = "login" | "signup" | "signup-verify";

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
      setError(
        err instanceof TypeError
          ? "Could not connect. Check your connection and try again."
          : err.message,
      );
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
      setDevCode(j.devCode || null);
      setMode("signup-verify");
    } catch (err: any) {
      setError(
        err instanceof TypeError
          ? "Could not connect. Check your connection and try again."
          : err.message,
      );
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
      setError(
        err instanceof TypeError
          ? "Could not connect. Check your connection and try again."
          : err.message,
      );
    } finally {
      setBusy(false);
    }
  }

  const loginActive = mode === "login";
  const signupActive = mode === "signup" || mode === "signup-verify";

  const tab = (id: "login" | "signup", label: string) => {
    const active =
      (id === "login" && loginActive) || (id === "signup" && signupActive);
    return (
      <button
        disabled={busy}
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
    <Modal
      open
      onClose={() => onClose?.()}
      title={loginActive ? "Welcome back" : "Create your account"}
    >
      <div className="flex border-b border-line">
        {tab("login", "Log in")}
        {tab("signup", "Sign up")}
      </div>

      <div className="pt-5">
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
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field label="Password">
              <input
                className="field"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            <button disabled={busy} className="btn-primary mt-2 w-full">
              {busy ? "Signing in…" : "Log in"}
            </button>
          </form>
        )}

        {mode === "signup" && (
          <form onSubmit={submitSignup} className="space-y-4">
            <Field
              label="Display name"
              hint="Your public name. Use 2–40 letters, numbers, spaces, periods, hyphens, or underscores."
            >
              <input
                className="field"
                autoComplete="nickname"
                required
                minLength={2}
                maxLength={40}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <Field label="Email">
              <input
                className="field"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field label="Password" hint="Use 8–128 characters.">
              <input
                className="field"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={128}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            <Field label="Confirm password">
              <input
                className="field"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={128}
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
                Local preview code (no email sent):{" "}
                <span className="font-mono font-semibold">{devCode}</span>
              </div>
            )}
            <p className="text-sm text-ink-soft">
              {devCode
                ? "Enter the preview code above to verify "
                : "Enter the 6-digit code sent to "}
              <span className="break-all font-medium text-ink">{email}</span>.
            </p>
            <Field label="Verification code">
              <input
                required
                pattern="[0-9]{6}"
                maxLength={6}
                inputMode="numeric"
                autoComplete="one-time-code"
                className="field text-center font-mono text-lg tracking-[0.4em]"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              />
            </Field>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy}
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
    </Modal>
  );
}
