"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth";
import { cx, Icon } from "@/components/ui";
import ThemeToggle from "@/components/ThemeToggle";
import { LogoMark, Wordmark } from "@/components/Logo";

type AppShellProps = {
  children: React.ReactNode;
  name?: string;
  setName?: (name: string) => void;
  focus?: boolean;
};
const navItems = [
  { href: "/", label: "Your desk" },
  { href: "/editor", label: "Write" },
  { href: "/stories", label: "Read" },
  { href: "/critique/short", label: "Exchange critiques" },
  { href: "/collaborate", label: "Write together" },
  { href: "/chat", label: "Conversation" },
  { href: "/game6", label: "Writing game" },
  { href: "/vocab", label: "Vocabulary" },
  { href: "/library", label: "My library" },
];

export function AppShell({ children, focus = false }: AppShellProps) {
  const { me, hydrated, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const active = (href: string) =>
    href === "/"
      ? pathname === "/"
      : href === "/critique/short"
        ? pathname.startsWith("/critique")
        : pathname === href || pathname.startsWith(`${href}/`);
  useEffect(() => {
    if (!open) return;
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        menuButton.current?.focus();
      }
    };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [open]);

  return (
    <div className={cx("app-shell", focus && "app-shell-focus")}>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      {!focus && (
        <header className="workshop-header">
          <div className="masthead">
            <Link
              href="/"
              className="brand"
              aria-label="Writers’ Workshop home"
            >
              <LogoMark size={32} />
              <Wordmark />
            </Link>
            <span className="masthead-note">Good writing takes company.</span>
            <div className="account-tools">
              <ThemeToggle />
              {hydrated &&
                (me ? (
                  <>
                    <Link
                      href="/profile"
                      className="account-name"
                      aria-label={`Profile for ${me.name}`}
                    >
                      <span className="avatar">
                        {me.name?.[0]?.toUpperCase() || "W"}
                      </span>
                      <span className="account-label">{me.name}</span>
                    </Link>
                    <Link
                      href="/settings"
                      className="settings-link"
                      aria-label="Settings"
                    >
                      <Icon name="settings" size={19} />
                    </Link>
                  </>
                ) : (
                  <Link href="/auth" className="btn-secondary account-login">
                    Log in <Icon name="arrow" size={15} />
                  </Link>
                ))}
              <button
                ref={menuButton}
                onClick={() => setOpen(!open)}
                className="menu-button"
                aria-expanded={open}
                aria-controls="mobile-navigation"
                aria-label={open ? "Close navigation" : "Open navigation"}
              >
                <Icon name={open ? "close" : "menu"} size={21} />
              </button>
            </div>
          </div>
          <div className="nav-band">
            <nav className="desktop-navigation" aria-label="Main">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cx(
                    "nav-link",
                    active(item.href) && "nav-link-active",
                  )}
                  aria-current={active(item.href) ? "page" : undefined}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          {open && (
            <div className="mobile-navigation" id="mobile-navigation">
              <nav aria-label="Mobile navigation">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={active(item.href) ? "page" : undefined}
                    className={active(item.href) ? "mobile-active" : ""}
                  >
                    {item.label}
                    <Icon name="arrow" size={15} />
                  </Link>
                ))}
              </nav>
              <div className="mobile-appearance">
                <span>Appearance</span>
                <ThemeToggle />
              </div>
              {me && (
                <div className="mobile-account">
                  <Link href="/profile" onClick={() => setOpen(false)}>
                    Profile
                  </Link>
                  <Link href="/settings" onClick={() => setOpen(false)}>
                    Settings
                  </Link>
                  <button
                    onClick={() => {
                      void logout();
                      setOpen(false);
                    }}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}
        </header>
      )}
      <main id="main-content" tabIndex={-1} className="app-main">
        {children}
      </main>
      {!focus && (
        <footer className="workshop-footer">
          <div className="footer-inner">
            <p>
              <span className="font-serif italic">
                A little further, every draft.
              </span>
              <span className="footer-name">Writers’ Workshop</span>
            </p>
            <nav aria-label="Footer">
              <Link href="/install">Install app</Link>
              <Link href="/explore">Explore stories</Link>
              <a href="https://github.com/gwilltsherman-byte/writers-workshop/issues">
                Report an issue
              </a>
              {me && <button onClick={() => void logout()}>Sign out</button>}
            </nav>
          </div>
        </footer>
      )}
    </div>
  );
}
