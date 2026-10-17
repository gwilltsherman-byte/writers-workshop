import React from "react";
import { cx } from "@/components/ui";

/**
 * A bordered manuscript sheet with a compact label and typed content.
 * Prompts and flashcards share this flat surface across the workshop.
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
