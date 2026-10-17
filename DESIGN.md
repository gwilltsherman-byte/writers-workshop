---
name: "Writers’ Workshop"
description: "A contemporary small-press cooperative for drafting, exchanging feedback, and reading."
colors:
  paper: "rgb(243 245 249)"
  surface: "rgb(247 249 252)"
  surface-raised: "rgb(255 255 255)"
  surface-sunken: "rgb(231 236 245)"
  ink: "rgb(29 39 62)"
  ink-soft: "rgb(69 81 106)"
  muted: "rgb(91 104 128)"
  line: "rgb(212 221 234)"
  line-strong: "rgb(167 181 205)"
  accent: "rgb(44 74 161)"
  accent-hover: "rgb(32 56 128)"
  accent-soft: "rgb(230 236 252)"
  accent-ink: "rgb(255 255 255)"
  success: "rgb(39 108 79)"
  danger: "rgb(167 46 58)"
  shadow: "rgb(30 47 80)"
  shell-blue: "rgb(35 61 137)"
  shell-ink: "rgb(246 249 255)"
  prompt-blue: "rgb(40 66 148)"
  prompt-ink: "rgb(255 255 255)"
  prompt-muted: "rgb(211 223 255)"
  dark-paper: "rgb(21 28 45)"
  dark-surface: "rgb(26 35 54)"
  dark-surface-raised: "rgb(31 42 64)"
  dark-surface-sunken: "rgb(17 24 39)"
  dark-ink: "rgb(233 239 251)"
  dark-ink-soft: "rgb(191 204 227)"
  dark-muted: "rgb(156 174 205)"
  dark-line: "rgb(57 72 99)"
  dark-line-strong: "rgb(92 111 145)"
  dark-accent: "rgb(161 185 255)"
  dark-accent-hover: "rgb(193 209 255)"
  dark-accent-soft: "rgb(41 58 94)"
  dark-accent-ink: "rgb(20 31 55)"
  dark-success: "rgb(132 211 177)"
  dark-danger: "rgb(255 160 169)"
  dark-shadow: "rgb(0 5 19)"
  dark-shell-blue: "rgb(28 44 85)"
  dark-shell-ink: "rgb(238 244 255)"
  dark-prompt-blue: "rgb(37 61 131)"
  dark-prompt-ink: "rgb(248 251 255)"
  dark-prompt-muted: "rgb(204 220 255)"
typography:
  display:
    fontFamily: "Literata, Georgia, Cambria, Times New Roman, serif"
    fontSize: "clamp(2.5rem, 1.7rem + 3.4vw, 4.25rem)"
    fontWeight: 600
    lineHeight: 1.04
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Literata, Georgia, Cambria, Times New Roman, serif"
    fontSize: "36px"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  reading-title:
    fontFamily: "Literata, Georgia, Cambria, Times New Roman, serif"
    fontSize: "clamp(2rem, 1.6rem + 1.6vw, 2.75rem)"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  section-title:
    fontFamily: "Literata, Georgia, Cambria, Times New Roman, serif"
    fontSize: "24px"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "-0.015em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  reader:
    fontFamily: "Literata, Georgia, Cambria, Times New Roman, serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.75
  manuscript:
    fontFamily: "Courier Prime, Courier New, Courier, ui-monospace, monospace"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 2
  button:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Arial, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 500
    lineHeight: 1.5
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.5
  prompt:
    fontFamily: "Literata, Georgia, Cambria, Times New Roman, serif"
    fontSize: "23px"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  control: "3px"
  sheet: "4px"
  dialog: "6px"
  avatar: "50%"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  content: "20px"
  lg: "24px"
  xl: "32px"
  page: "40px"
  section: "64px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "8px 16px"
  button-accent:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "8px 16px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "8px 16px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-soft}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.ink-soft}"
  button-accent-hover:
    backgroundColor: "{colors.accent-hover}"
  field:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "10px 14px"
    width: "100%"
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.control}"
    padding: "4px 12px"
  chip-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
  navigation-link:
    backgroundColor: "{colors.shell-blue}"
    textColor: "{colors.shell-ink}"
    padding: "0 9px"
  prompt-sheet:
    backgroundColor: "{colors.prompt-blue}"
    textColor: "{colors.prompt-ink}"
    rounded: "{rounded.sheet}"
    padding: "22px 30px 25px"
---

# Design System: Writers’ Workshop

## Overview

**Creative North Star: "The Small-Press Cooperative"**

Writers’ Workshop presents writing as shared craft. Cool paper, cobalt navigation, clear editorial rules, and a drawn paragraph mark give the interface the character of a contemporary small press. The screen stays useful and direct, with space for a writer’s words and compact controls around them.

Literata carries authored words and literary headings; Courier Prime marks work in progress; the system sans stack carries tools and metadata. Surfaces remain flat and quietly separated. The same relationships continue into a blue night palette without adding physical texture.

**Key Characteristics:**
- Cool paper and cobalt, with a separate night palette.
- Literary serif, manuscript mono, and compact sans have distinct jobs.
- Bordered work surfaces, open lists, and quiet reading measure.
- Plain labels make local, shared, and public consequences visible.

This scan records the implemented redesign, replacing the earlier manuscript-and-red-pencil identity under the user’s explicit redesign authorization. Source authority is `src/app/globals.css`, `tailwind.config.ts`, `src/app/layout.tsx`, and the shared components. Product behavior is defined in `PRODUCT.md`; the home composition and reference inspection record live in `.impeccable/briefs/workshop.md`.

## Colors

The palette combines blue-tinted paper and ink with cobalt work areas. Frontmatter preserves the source’s RGB format; keys prefixed `dark-` are corresponding `.dark` overrides, not additional brand accents.

### Primary

- **Cobalt accent** (`accent`, `accent-hover`, `accent-soft`, `accent-ink`): action buttons, text links, focus, selections, and badges.
- **Navigation cobalt** (`shell-blue`, `shell-ink`): desktop navigation and mobile menu.
- **Prompt cobalt** (`prompt-blue`, `prompt-ink`, `prompt-muted`): the home starting-point sheet and supporting text. It remains saturated in both themes.

### Neutral

- **Cool paper** (`paper`): the page field.
- **Working surfaces** (`surface`, `surface-raised`, `surface-sunken`): cards, manuscript sheets, fields, dialogs, hover fills, and status areas.
- **Blue ink** (`ink`, `ink-soft`, `muted`): primary text, supporting text, and metadata.
- **Editorial rules** (`line`, `line-strong`): dividers and stronger field boundaries.
- **Shadow ink** (`shadow`): the modal’s translucent shadow.

Success and danger retain separate semantic colors. Use them for status text and subtle matching backgrounds with a written message. The inherited `rule` and `gold` variables have no current component consumers, so they are not recorded as reusable tokens here.

**The Visible State Rule.** Pair color with a readable label, underline, border, or status message so that selection and consequences remain understandable.

## Typography

**Display and reading font:** self-hosted Literata, with Georgia, Cambria, Times New Roman, and serif fallbacks. Normal and italic variable files support weights 200–900.

**Tool and body font:** the operating-system sans stack. It is used for practical UI rather than literary display.

**Manuscript font:** self-hosted Courier Prime, with Courier New, Courier, and monospace fallbacks. Shipped files cover normal 400 and 700.

### Hierarchy

- **Display:** the fluid `display` ramp serves the not-found heading; it is not the homepage title size.
- **Page heading:** the `headline` role is 36px and weight 500; shared page headers reduce to 30px at the 800px breakpoint.
- **Reading title:** the fluid `reading-title` ramp serves published story titles and standalone account headings.
- **Section title:** 24px, weight 500. Story-list titles use 1.4rem with a snug line height.
- **Body:** 16px sans with 1.5 line height. Labels and secondary copy commonly step down to 14px; shared buttons and fields use 15px.
- **Reader:** 18px Literata at 1.75 line height, in a container capped at 65ch. Preserve authored whitespace.
- **Manuscript:** 17px Courier Prime at line height 2. Draft titles use bold mono and wrap; the editor title uses 24px on narrow screens and 30px from 640px.
- **Prompt:** 23px Literata at line height 1.5; supporting copy uses sans.

Headings balance text, paragraphs use pretty wrapping, and long visible text can wrap anywhere. Font provenance and OFL licenses are recorded in `src/app/fonts/README.md`.

**The Authored Words Rule.** Use Literata for literary headings and published prose, Courier Prime for manuscript text, and sans for controls and metadata.

## Layout

The shared frame is capped at 1280px. Desktop content has 44px top, 40px horizontal, and 64px bottom padding. At 1100px, horizontal padding becomes 28px. At 800px, the shell switches to a compact masthead and menu, with 30px top, 20px horizontal, and 44px bottom content padding. The menu uses two columns and marks the current route. At 400px, appearance moves into the mobile menu.

Spacing follows the existing 4px utility rhythm, with 20–32px within content groups and 40–64px around larger regions. Containers own their padding: the base card does not impose it, while shared card headers and bodies use 20px. The manuscript sheet uses 20px horizontal padding on mobile and 40px from 640px.

The home’s actual draft and prompt use a 1.35:1 grid, reducing to 1.15:1 at 1100px and stacking draft first at 800px. Supporting paths are separated with rules. This arrangement belongs to the home surface, not every future page.

Published work uses a centered 65ch reading column with left-aligned prose. Story indexes are open rows with dividers, title, byline, excerpt, and date. Focused writing reduces the shared content frame to 1100px and the inner writing area to 56rem.

## Elevation & Depth

Ordinary cards, manuscripts, fields, and story rows are flat. Depth comes from differences between the page field, raised paper, sunken fills, and one-pixel rules. The native dialog is the lifted layer, with a dimmed backdrop. Inherited `shadow-card` and `shadow-lift` utilities have no current consumers and are not prescribed for new components.

### Shadow Vocabulary

- **Dialog:** `0 24px 80px rgb(var(--shadow) / 0.32)`; backdrop `rgb(10 20 40 / 0.55)`.

**The Flat Surface Rule.** Use borders and tonal changes for ordinary work surfaces. Reserve the implemented deep shadow for the modal dialog.

## Shapes

Controls and shared cards have barely softened 3px corners. The home draft and prompt use 4px; the dialog uses 6px. The manuscript sheet remains square. Circles serve avatars and status dots rather than turning every action into a pill.

The paragraph mark is the recurring identity shape. Functional icons use inline SVG with round caps and joins and a consistent 1.8 stroke weight. Do not depend on a font’s arrow, check, or close glyph.

## Components

### Buttons

Compact, named, and easy to hit. Standard buttons use 8px by 16px padding, a minimum height of 44px, 15px medium sans, and 3px corners. Primary uses ink and paper; accent uses cobalt and contrast text; secondary uses a strong border and clear background; ghost starts with soft ink. Hover shifts fill or border. Disabled buttons reduce opacity and use a not-allowed cursor. Focus is a 2px accent outline with 2px offset. Color transitions use 150ms ease-out.

### Chips and status

Selectable chips have a small radius, strong border, 12px horizontal padding, and 44px minimum height. Selection changes fill to ink and text to paper. Noninteractive tags have a 36px minimum height. Accent badges use a tinted background and border. Notices keep an explicit message and semantic status or alert role.

### Cards / Containers

The base card uses a surface fill and single line-colored border; a raised variant uses raised paper. Shared card headers and bodies use 20px padding. The vocabulary/prompt `IndexCard` is now a flat bordered sheet with a separated header. Its header uses 24px horizontal and 16px vertical padding; content uses 24px horizontal and 28px vertical padding.

### Inputs / Fields

Shared fields use a raised surface, strong border, 3px corners, and 10px by 14px padding. Focus shifts the border toward ink and adds a 2px accent ring at 20% opacity. Every field needs a visible or accessible label. The manuscript editor uses a plain background and separate outline. Its title wraps and grows with content.

### Navigation

A raised-paper masthead sits above the cobalt band. Desktop links are 52px tall and 13px sans; the active route gains weight and a 3px underline. Hover adds a translucent light fill. The 800px mobile menu retains cobalt and a visible active state. Focus on cobalt uses its light text token.

### Prompt sheet

The home prompt uses cobalt, a functional heading, generous literary prompt, optional constraint, and ruled footer. Shuffle is 44px square. A new prompt runs a 180ms ease-out fade and 3px rise. Shared vocabulary/card content runs a 220ms deal with `cubic-bezier(0.22, 1, 0.36, 1)` and a 6px rise. Reduced-motion rules disable these animations, skeleton pulses, and control transitions.

### Story list and reader

Rows use 24px vertical space and one-pixel separators. Titles change to accent on hover; byline and date remain secondary. The reader uses the measure above, a quiet rule above prose, and paragraph end mark below. Authored text remains dominant over tools.

### Dialog

The native dialog is capped at 520px, with 16px viewport side clearance and a maximum height of viewport minus 40px. It can scroll. Title and close control stay explicit. Escape and backdrop activation close it; focus returns to the prior control.

## Do's and Don'ts

### Do:
- Do preserve the manuscript-to-typeset distinction.
- Do keep controls legible, named, and visibly focused; standard buttons have a minimum height of 44px.
- Do use the theme tokens for both light and dark surfaces.
- Do let titles and user-written text wrap, and keep published prose at the established reading measure.
- Do use the existing paragraph mark and inline SVG icons.
- Do state device storage, shared-room behavior, and public publication in plain language.

### Don't:
- Don’t reintroduce the superseded red-and-cream palette or faux ruled-card decoration.
- Don’t use the system sans stack as a display face for literary headings.
- Don’t add decorative uppercase eyebrows, emoji icons, or hard offset shadows.
- Don’t replace the typographic story list with a cover-art grid when no such assets exist.
- Don’t add fictional activity, testimonials, or member statistics.

Not canonized: unused inherited palette and shadow utilities are excluded from the current system. Earlier source comments describing red ruled cards and Literata as all interface text were corrected during final review. This document does not certify complete accessibility compliance or production deployment; final checks and their limits are recorded in `VERIFICATION.md`.
