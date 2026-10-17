# Verification — 17 October 2026

## Environment

The implementation was exercised locally with Next.js 16.4.0, React 19.3.0,
Prisma 5.22.0, and the bundled Node.js 24.19.0 runtime. The project recommends
Node.js 22; that version was not separately exercised in this session.

Dependencies were copied into an isolated local `node_modules` from an existing
checkout whose `package-lock.json` exactly matched this checkout. No production
data or remote database was used. Prisma Client was regenerated successfully.

The development preview runs at `http://localhost:3017` against an isolated
local PostgreSQL database on port 55447. All seven migrations applied. The local
`.env`, database, and runtime launcher are ignored files. Production builds and
tests used the same checkout while Next's separate `.next/dev` output kept the
development preview available.

The test database and production smoke database are temporary and are removed
on completion. PostgreSQL needed an approved escape from the filesystem sandbox
because local shared-memory allocation is unavailable inside it. The build,
lint, and TypeScript checks ran inside the network-restricted sandbox.

## Automated results

| Check | Result |
| --- | --- |
| Full ESLint | Passed, no warnings |
| TypeScript, `--noEmit` | Passed |
| Integration/unit suite | 14 passed, 0 failed |
| Prisma Client generation | Passed |
| Production webpack build | Passed; all 22 static pages generated and API routes built |
| Production HTTP smoke | Passed against a local-only mailbox and temporary database |

After the final dialog keyboard-wrap correction, the changed component passed
ESLint again, the complete TypeScript check passed again, and the production
build was regenerated to include that correction. A subsequent account-identity
correction was also checked with targeted ESLint, full TypeScript, a fresh
production build, and the expanded production smoke test.

Actual command forms used from the repository root are below. `npm` was not
available on the bundled runtime's PATH, so the equivalent installed entry
points were invoked directly. The runtime directory was added to PATH for
child processes.

```sh
# Bundled Node.js bin directory added to PATH for this session.
node node_modules/eslint/bin/eslint.js .
node node_modules/typescript/bin/tsc --noEmit
node node_modules/prisma/build/index.js generate
node node_modules/tsx/dist/cli.mjs --test tests/*.test.ts
node node_modules/next/dist/bin/next build --webpack
node node_modules/tsx/dist/cli.mjs tests/preview.ts
```

## Functional evidence

The 14-test suite covers draft backup/restore and storage failures; guest-token
boundaries; chat matching, history, outsider exclusion, and leaving; duplicate
queue joins and cancellation; critique piece/feedback persistence and mutual
chat consent; complete two-player games, votes, ties, and rematches; six-player
roles/capacity; persisted timeouts; concurrent matchmaking; invitation switching;
shared-draft creation; and conflicting shared-draft saves.

The production HTTP smoke checks actual endpoints for signup, local verification
mail, account verification, login, password changes, email changes, story
publication and reading, vocabulary, guest sessions, chat, private history, and
unauthorized live access. Production responses do not expose verification codes.

Additional regression cases were added for this implementation:

- Both `genre=Fiction` and `genre=fiction` return stories stored with either
  canonical `Fiction` or legacy lowercase `fiction`, and exclude `Poetry`.
- `/api/library` returns 401 without an account session.
- Both account-library endpoints return the account's work under an earlier pen
  name and exclude another account's story with a matching display name.
- Changing account email retains the exact same published stories. Account email,
  story ownership, and the consumed email-change code are updated atomically.
- A cookie issued before an email change resolves the account's current identity.
  Both library endpoints preserve that session's existing work, exclude work
  associated with the released email address, and include a new story published
  through the older cookie under the current email. Session lookup validates the
  signed user ID, then reads current account fields; database failures propagate
  rather than being treated as invalid credentials.
- Creating a shared draft immediately persists its document. A production HTTP
  create followed directly by `/api/library` includes the new draft without an
  additional save. Concurrent-save protection remains covered.

The smoke harness now exits with status 1 explicitly on failure, after an earlier
assertion failure revealed that its previous teardown could obscure that status.

## Limits of this evidence

A successful network-restricted build confirms that local fonts and build assets
need no external fetch. It does **not** verify browser offline behavior. Offline
service-worker operation and installed iPhone/Mac app behavior were not exercised
by these automated checks.

Email was delivered only to the smoke test's local SMTP mailbox. External SMTP
credentials, real email delivery, Netlify deployment, remote database access, and
production concurrency/load were not tested or changed. The normal development
preview has SMTP disabled and labels its verification code as a local preview.

Browser checks below complement the automated results; neither substitutes for the other.

## Browser and visual checks

The running application was exercised with the Codex in-app Chromium browser at
1440 × 1000 and 390 × 844. Screenshots cover the home, editor, story reader,
critique, library, shared writing, game lobby, vocabulary, conversation, settings,
authentication, publication dialog, and offline editor. The final captures in
`.impeccable/review/*-final.jpg` confirm the coordinated review corrections.

Completed through the interface:

- Prompt → editor; title, body, and genre edits → saved state → reload with the
  same content. Focus mode → Escape returns to the complete writing desk.
- Draft → critique with matching text/title → queue → cancel.
- Local demonstration signup → preview verification → publish review →
  publication success → complete story → genre search → account library.
- A search with no matches → explanatory empty state → Clear search restores
  results. A nonexistent story displays the error state and a route back.
- Download backup → file chooser → restore confirmation; cancelling preserves
  the draft, confirming restores it and reports success.
- Shared draft creation → reload at the same link retains title/body → Save
  reports Version 1 and saved/shared state. The immediate-library regression
  after first creation was additionally exercised by the HTTP smoke.
- Writing-game room creation → one-writer lobby with disabled Start → leave.
  Conversation queue → cancel. Vocabulary answer → feedback → next word.
- Mobile navigation routes correctly. Appearance remains accessible in the
  compact navigation; dark/light toggling works. Profile has its full accessible
  name. No horizontal overflow on the confirmed 390px home/editor surfaces.
- Long title wraps completely at both sizes. Mobile title scroll height equals
  its client height. Hidden responsive breaks preserve spaces.
- Native publication dialog: Shift+Tab from first control wraps to last; Tab
  from last wraps to first; Escape closes and returns focus to Review & publish.
  Visible focus is present in final editor captures.
- The standalone offline editor opens with the same saved local title/body and
  fits the mobile viewport. This was a direct page visit, not a network-offline test.

The combined design review is in `.impeccable/review/review.md`; corrections and
final disposition are in `verdict.md` in that directory. The static Impeccable
anti-pattern detector returned no findings. Shipping PNG assets all carry origin
metadata; the provenance scan reported five rasters and zero missing records.

Computed contrast from the actual CSS tokens passed 4.5:1 for the checked text
pairs in both themes: body, muted text on paper and raised surfaces, primary
buttons, navigation, prompt secondary text, success, and error. The lowest of
these was muted text on light paper at 5.15:1. This is a targeted token check,
not an exhaustive accessibility certification.

Not exercised in the browser: a complete two-person critique/conversation or
multiplayer game, password/email credential changes, OS-level app installation,
actual disconnected-network service-worker fallback, screen-reader software,
or OS reduced-motion emulation. Multiplayer, account changes, and storage errors
are covered by automated tests; reduced-motion rules were inspected in source.
