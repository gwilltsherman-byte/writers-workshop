import React from "react";
import { cx } from "@/components/ui";

/**
 * A ruled 3×5 index card: a label above the red headline rule, then typed
 * lines on blue rules. Prompts and flashcards use it across the site.
 * Change `cardKey` to deal a fresh card (it replays the short deal-in motion).
 */
export function IndexCard({
  label,
  children,
  cardKey,
  className,
  linesClassName,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  cardKey?: React.Key;
  className?: string;
  linesClassName?: string;
}) {
  return (
    <div className={cx("index-card", className)}>
      <div className="index-card-head">{label}</div>
      <div key={cardKey} className={cx("index-card-lines animate-deal", linesClassName)}>
        {children}
      </div>
    </div>
  );
}
