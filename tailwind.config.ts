import type { Config } from "tailwindcss";

/**
 * Design tokens. See DESIGN.md for the brief behind them.
 * Colors are driven by CSS variables (see globals.css) as `R G B` triplets so
 * every utility supports opacity (e.g. `bg-surface/60`) and flips cleanly
 * between light and dark via the `.dark` class on <html>.
 */
const withVar = (v: string) => `rgb(var(${v}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: withVar("--paper"),
        surface: {
          DEFAULT: withVar("--surface"),
          raised: withVar("--surface-raised"),
          sunken: withVar("--surface-sunken"),
        },
        ink: {
          DEFAULT: withVar("--ink"),
          soft: withVar("--ink-soft"),
        },
        muted: withVar("--muted"),
        line: {
          DEFAULT: withVar("--line"),
          strong: withVar("--line-strong"),
        },
        accent: {
          DEFAULT: withVar("--accent"),
          hover: withVar("--accent-hover"),
          soft: withVar("--accent-soft"),
          ink: withVar("--accent-ink"),
        },
        rule: withVar("--rule"),
        gold: withVar("--gold"),
        success: withVar("--success"),
        danger: withVar("--danger"),
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Arial",
          "sans-serif",
        ],
        // Literata: headings, interface text and published (typeset) work.
        serif: [
          "var(--font-serif)",
          "Georgia",
          "Cambria",
          "Times New Roman",
          "serif",
        ],
        // Courier Prime: anything that is still a draft (typescript).
        mono: [
          "var(--font-mono)",
          "Courier New",
          "Courier",
          "ui-monospace",
          "monospace",
        ],
      },
      fontSize: {
        display: [
          "clamp(2.5rem, 1.7rem + 3.4vw, 4.25rem)",
          { lineHeight: "1.04", letterSpacing: "-0.03em" },
        ],
        title: [
          "clamp(2rem, 1.6rem + 1.6vw, 2.75rem)",
          { lineHeight: "1.1", letterSpacing: "-0.02em" },
        ],
      },
      borderColor: { DEFAULT: withVar("--line") },
      // Paper has barely-softened corners. Use `rounded` everywhere;
      // `rounded-full` is only for avatars and status dots.
      borderRadius: { DEFAULT: "3px" },
      // Two levels, for things that physically sit above the page.
      boxShadow: {
        card: "0 1px 1px rgb(var(--shadow) / 0.06), 0 6px 18px -8px rgb(var(--shadow) / 0.22)",
        lift: "0 2px 4px rgb(var(--shadow) / 0.08), 0 24px 48px -16px rgb(var(--shadow) / 0.35)",
      },
      maxWidth: { prose: "65ch" },
      letterSpacing: { tightish: "-0.015em" },
      keyframes: {
        deal: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: { deal: "deal 220ms cubic-bezier(0.22, 1, 0.36, 1) both" },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
export default config;
