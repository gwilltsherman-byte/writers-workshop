"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth";
import { cx } from "@/components/ui";
import ThemeToggle from "@/components/ThemeToggle";
import { LogoMark, Wordmark } from "@/components/Logo";

type AppShellProps = {
  children: React.ReactNode;
  name?: string;
  setName?: (name: string) => void;
};

const navItems = [
  { href: "/editor", label: "Write" },
  { href: "/stories", label: "Stories" },
  { href: "/critique/short", label: "Critique" },
  { href: "/chat", label: "Chat" },
  { href: "/game6", label: "Game" },
  { href: "/vocab", label: "Vocab" },
  { href: "/library", label: "Library" },
];

function NavLink({
  href,
  label,
  active,
  onClick,
}: {
  href: string;
  label: string;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cx(
        "relative py-2 text-[0.9375rem] transition-colors duration-150",
        active ? "text-ink" : "text-ink-soft hover:text-ink"
      )}
      aria-current={active ? "page" : undefined}
    >
      {label}
      <span
        className={cx(
          "absolute bottom-0.5 left-0 h-[2px] bg-accent transition-[width] duration-200 ease-out",
          active ? "w-full" : "w-0"
        )}
      />
    </Link>
  );
}

export function AppShell({ children }: AppShellProps) {
  const { me, hydrated, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || (pathname?.startsWith(`${href}/`) ?? false);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-paper">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Link href="/" className="flex items-center gap-1.5">
            <LogoMark size={30} />
            <Wordmark className="text-lg text-ink" />
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-6 lg:flex">
            {navItems.map((item) => (
              <NavLink key={item.href} {...item} active={isActive(item.href)} />
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle className="hidden sm:grid" />
            {!hydrated ? (
              <div className="h-11 w-24 animate-pulse rounded bg-surface-sunken" />
            ) : me ? (
              <div className="hidden items-center gap-2 sm:flex">
                <Link
                  href="/profile"
                  className="flex min-h-11 items-center gap-2 rounded px-2.5 text-[0.9375rem] text-ink transition-colors hover:bg-surface-sunken"
                >
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-ink text-xs font-semibold text-paper">
                    {me.name?.[0]?.toUpperCase() ?? "?"}
                  </span>
                  {me.name}
                </Link>
                <button onClick={logout} className="btn-ghost px-3">Sign out</button>
              </div>
            ) : (
              <Link href="/auth" className="btn-primary hidden px-4 sm:inline-flex">Log in</Link>
            )}
            <button
              onClick={() => setOpen((v) => !v)}
              className="grid h-11 w-11 place-items-center rounded border border-line-strong text-ink transition-colors hover:bg-surface-sunken lg:hidden"
              aria-expanded={open}
              aria-label="Toggle navigation"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
          </div>
        </div>

        {open && (
          <div className="border-t border-line bg-paper px-4 py-4 lg:hidden">
            <nav aria-label="Main" className="mx-auto flex max-w-6xl flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cx(
                    "flex min-h-11 items-center border-l-2 px-3 text-base transition-colors",
                    isActive(item.href) ? "border-accent text-ink" : "border-transparent text-ink-soft hover:bg-surface-sunken hover:text-ink"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mx-auto mt-4 flex max-w-6xl items-center gap-2 border-t border-line pt-4">
              <ThemeToggle />
              {me ? (
                <>
                  <Link href="/profile" onClick={() => setOpen(false)} className="btn-secondary">Profile</Link>
                  <Link href="/settings" onClick={() => setOpen(false)} className="btn-secondary">Settings</Link>
                  <button onClick={() => { logout(); setOpen(false); }} className="btn-primary ml-auto">Sign out</button>
                </>
              ) : (
                <Link href="/auth" onClick={() => setOpen(false)} className="btn-primary ml-auto">Log in / Sign up</Link>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">{children}</main>

      <footer className="border-t border-line">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-sm text-muted sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <Link href="/" className="inline-flex items-center gap-1 text-ink">
              <LogoMark size={20} />
              <Wordmark className="text-base" />
            </Link>
            <p className="mt-2">
              Questions or problems?{" "}
              <a href="https://github.com/gwilltsherman-byte/writers-workshop/issues" className="text-ink-soft underline decoration-line-strong hover:text-ink hover:decoration-ink">
                Report an issue
              </a>
            </p>
            <p className="mt-1">Set in Literata and Courier Prime.</p>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-1">
            <Link href="/stories" className="py-2 transition-colors hover:text-ink">Stories</Link>
            <Link href="/editor" className="py-2 transition-colors hover:text-ink">Write</Link>
            <Link href="/critique/short" className="py-2 transition-colors hover:text-ink">Critique</Link>
            <Link href="/vocab" className="py-2 transition-colors hover:text-ink">Vocab</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
