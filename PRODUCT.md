# Writers’ Workshop
<!-- impeccable:product-schema 1 -->

## Platform
web

## Users
The existing product serves hobby writers of fiction, poems, and essays who want practice and readers. The redesign assumes individuals returning for 15–60 minute desktop writing sessions and shorter mobile reading, drafting, and conversation sessions. These session lengths are design assumptions, not measured analytics.

## Product Purpose
Keep a private draft, exchange constructive feedback, and publish when ready. Success: resume saved writing immediately; start from a prompt without losing a draft; transfer writing into critique; understand whether work is local or shared; read a complete story comfortably; navigate and complete tasks on a phone or keyboard.

## Operating Context
The personal draft is saved on this browser/device and supports backup/restore and offline use. Accounts publish stories; guest identities can participate in chat, critique, shared drafts, and two-to-six-player writing games. The existing dictionary offers vocabulary practice.

## Capabilities and Constraints
Next.js 16, React 19, TypeScript, Tailwind, PostgreSQL/Prisma, cookie-based accounts and signed guest identities. Live rooms use polling and database transactions. Preserve routes, APIs, migrations, access checks, game rules, and local draft data compatibility. Email delivery requires SMTP; do not imply it is configured. Use isolated development data for verification. Production hosting is outside the redesign's deployment scope.

## Brand Commitments
Keep Writers’ Workshop, its paragraph mark, and its plain, encouraging voice. User explicitly delegates creative direction and asks for one implemented result, not style options. Existing visual rules are evidence for a substantial redesign, not a requirement to retain the old visual world.

## Evidence on Hand
Repository documentation, source, curated story references and public-domain dictionary, the running hosted app. No invented activity, member counts, testimonials, or sample community posts. Local verification content must be marked as demonstration/test data.

## Product Principles
- Put the writer's actual draft ahead of promotional content.
- Make the boundary between private device storage and shared work explicit.
- Treat giving feedback as equally valuable as receiving it.
- Preserve a writer's words through errors, navigation, and interrupted sessions.
- Reading and writing deserve room; repeated tools deserve precision.

## Accessibility & Inclusion
Desktop/mobile layouts, keyboard operation, visible focus, named controls, accessible dialogs, readable contrast, reduced motion, long-content wrapping, clear errors and retry paths.
