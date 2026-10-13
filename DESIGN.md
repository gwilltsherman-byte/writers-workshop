# Design

How Writers’ Workshop looks, and why. Read this before adding a page or a
component, and keep new work inside these tokens.

## Visual references

- **Audience:** people who write fiction, poems and essays as a hobby and want
  readers. In five seconds a visitor should get: *write something here, trade
  critiques with other writers, publish when it’s ready.*
- Drafts use manuscript typography; published work uses book typography.
- **Source material:** a manuscript in standard submission format (typewriter
  face, double-spaced, “about 1,200 words” in the top corner, title centered);
  the 3×5 ruled index cards writers keep prompts on; the black-and-red
  typewriter ribbon and the editor’s red pencil.
- The index card appears in prompts (home page, writing game) and
  vocabulary flashcards. These use ruled 3×5 cards: a label above a red headline
  rule, typed text sitting on blue rules. See `src/components/IndexCard.tsx`.
- **The rule behind the type:** drafts are typed and published work is typeset. Anything
  still a draft (the editor, prompts, pieces under critique, game entries) is
  set in Courier Prime. Headings, interface text and published stories are set
  in Literata.

## Type

| Role | Face | Why |
| --- | --- | --- |
| Headings, UI, published stories (`font-serif`, the body default) | **Literata** (variable, with optical sizes) | Drawn for long-form reading on screens, so published stories read like a book. |
| Drafts, prompts, timers (`font-mono`) | **Courier Prime** 400/700 | Courier redrawn for manuscripts and screenplays. Writing in it feels like drafting. |

- Two families only. Never use `font-sans`.
- `text-display` for the home headline and the 404 page, `text-title` for page titles, then
  `text-2xl` / `text-xl` for section heads. Body copy 16-18px.
- Drafts use the `.typescript` class: 17px, line-height 2 (double-spaced).
- Literata’s web subset has no →, ✓ or ✕. Use `<Icon name="arrow|back|check|close" />`
  from `components/ui.tsx` instead of those characters.

## Color

Built in OKLCH, stored as `R G B` triplets in `src/app/globals.css`, exposed as
Tailwind colors in `tailwind.config.ts`. Never use raw Tailwind palette classes
(`slate-500`, `indigo-600`) or `rgb(var(--…))` in class names.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `paper` | `#faf9f6` bond paper | `#171412` carbon | page background |
| `surface-raised` | `#ffffff` | `#25221f` | index cards, dialogs, the manuscript sheet |
| `ink` | `#201b17` ribbon black | `#ece9e4` | text, primary buttons |
| `ink-soft` / `muted` | `#494440` / `#68625e` | `#cac7c2` / `#9f9b95` | secondary text, meta |
| `accent` | `#c02d22` ribbon red | `#ed7761` | one main action per screen, active nav, the card’s red rule |
| `rule` | `#a8c9e2` | `#335166` | index-card blue rules only |

Red stays rare: one accent button per screen, plus links that are the page’s next
step (`.link-accent`). Every text pairing above passes WCAG AA (muted on paper
is 5.7:1 light, 6.6:1 dark).

Dark mode uses a separate palette based on carbon paper.

## Shape, depth, motion

- Corners: `rounded` (3px) everywhere. `rounded-full` only for avatars and
  status dots. No pill buttons.
- Shadows: `shadow-card` for index cards (paper sitting on the page),
  `shadow-lift` for dialogs. Everything else uses borders and tonal shifts.
- Buttons and interactive elements are at least 44px tall (`min-h-11`).
- A freshly dealt index card slides in (`animate-deal`,
  220ms ease-out). Interface transitions are 150-200ms, color/opacity/transform
  only. `prefers-reduced-motion` is honored globally.

## Layout

- Left-aligned by default; centering is reserved for the manuscript title and
  the story end mark.
- Lists over cards: published stories are a typographic contents list
  (`components/StoryList.tsx`) under a 2px ink rule, never a card grid.
- No cards inside cards.

## Component conventions

- Inter, Fraunces, system-ui or any third family
- Gradients, glows, blur/glass headers, grain overlays
- Emoji as icons; icons in tinted circles or squares
- Uppercase tracked “eyebrow” labels; typewriter type used as decoration
  rather than for drafts
- `alert()` for feedback; use an inline `<Notice>`
- Invented testimonials, member counts or stats
- Inputs without a label (visible, `sr-only`, or `aria-label`)

