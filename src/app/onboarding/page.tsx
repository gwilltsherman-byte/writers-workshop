import Link from "next/link";
import { AppShell } from "@/components/shell";
import { PageHeader, Icon } from "@/components/ui";

const paths = [
  {
    href: "/editor",
    title: "Start with a draft",
    description:
      "A quiet place to write. Your personal draft stays in this browser, and you can save a backup to take with you.",
  },
  {
    href: "/explore",
    title: "Find something to read",
    description:
      "Browse published stories by title, author, or genre. Read at your own pace.",
  },
  {
    href: "/chat",
    title: "Meet another writer",
    description:
      "Find a conversation, exchange feedback, or invite a partner to a shared draft. Live activities need an internet connection.",
  },
];

export default function Onboarding() {
  return (
    <AppShell>
      <PageHeader
        title="A place for your writing"
        description="Bring a first sentence, a finished piece, or just your curiosity. There’s no setup to finish before you begin."
      />
      <div className="max-w-3xl divide-y divide-line border-y border-line-strong">
        {paths.map((path) => (
          <Link
            key={path.href}
            href={path.href}
            className="group flex items-start gap-5 py-7"
          >
            <div className="min-w-0 flex-1">
              <h2 className="font-serif text-2xl text-ink group-hover:text-accent">
                {path.title}
              </h2>
              <p className="mt-2 max-w-[60ch] leading-relaxed text-ink-soft">
                {path.description}
              </p>
            </div>
            <Icon name="arrow" className="mt-2 text-accent" />
          </Link>
        ))}
      </div>
      <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted">
        Write and join live activities as a guest.{" "}
        <Link href="/auth" className="text-ink underline underline-offset-4">
          Create an account
        </Link>{" "}
        when you’re ready to publish or return to the same identity on another
        device.
      </p>
    </AppShell>
  );
}
