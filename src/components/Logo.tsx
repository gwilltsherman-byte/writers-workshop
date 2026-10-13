import React from "react";
import { cx } from "@/components/ui";

/**
 * The site mark: a pilcrow (¶, the editor's paragraph sign) with an ink-drop
 * bowl in the accent colour and a slight italic lean. Colours come from the
 * theme tokens, so it flips with light and dark mode.
 */
export function LogoMark({ size = 30, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className={cx("shrink-0", className)}>
      <g transform="skewX(-8) translate(3 0)">
        <path fill="rgb(var(--accent))" d="M15.2 4C9.4 4 6 7.6 6 11.8C6 16.6 10.4 19.4 15.2 22.5Z" />
        <path
          fill="rgb(var(--ink))"
          d="M14 4H24.5V6.4H22.8V26.6L21.5 28.2L20.4 26.6V6.4H17.6V26.6L16.3 28.2L15.2 26.6V4Z"
        />
      </g>
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cx("font-serif tracking-tightish", className)}>
      <span className="font-semibold">Writers’</span> <span className="italic">Workshop</span>
    </span>
  );
}
