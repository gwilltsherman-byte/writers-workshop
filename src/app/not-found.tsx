import Link from "next/link";
import { AppShell } from "@/components/shell";

export default function NotFound() {
  return (
    <AppShell>
      <section className="max-w-2xl py-12 lg:py-20">
        <p className="font-mono text-muted">[page missing]</p>
        <h1 className="mt-4 text-display font-semibold text-ink">We can’t find that page.</h1>
        <p className="mt-6 max-w-[48ch] text-lg leading-relaxed text-ink-soft">
          The link might be broken, or the page may have moved.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/" className="btn-accent px-5">Back home</Link>
          <Link href="/stories" className="btn-secondary px-5">Browse stories</Link>
        </div>
      </section>
    </AppShell>
  );
}
