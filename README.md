# Writers’ Workshop

[Run on Mac and iPhone](RUNNING.md), including GitHub hosting options.

A website for writers. Write drafts, swap critiques with other writers, play
timed writing games, and publish your work to a shared library.

**Stack:** Next.js 14 (App Router) · Prisma + PostgreSQL · Tailwind (custom
editorial design system, light + dark) · Socket.IO + Yjs for realtime.

---

## Local development

```bash
cp .env.example .env      # set DATABASE_URL (and AUTH_SECRET)
npm install
npm run migrate           # create the database schema
npm run dev               # http://localhost:3000  (web + realtime)
```

`npm run dev` runs `server/index.ts`, which serves the Next.js app **and** the
realtime layer (Socket.IO + Yjs) so every feature works locally.

---

## Deploying to Netlify

The app is Netlify-ready. Pages and every `/api/*` route become serverless
functions via `@netlify/plugin-nextjs` (config in `netlify.toml`).

1. Push this repo to GitHub and “Add new site → Import” in Netlify.
2. Set environment variables (Site settings → Environment):
   - `DATABASE_URL`: a hosted Postgres (Neon/Supabase pooled connection).
   - `AUTH_SECRET`: generate one with `openssl rand -base64 32`.
   - `APP_BASE_URL`: your Netlify site URL.
   - `SMTP_*`: optional. Without them, verification codes show up in the UI.
3. Deploy. Build command and Node version are already set in `netlify.toml`.

Run migrations against your hosted DB once (locally, with `DATABASE_URL`
pointing at it): `npx prisma migrate deploy`.

### Realtime on a serverless host

Netlify is serverless and can’t keep a WebSocket server running, so the live
features (**chat, 10-min and 1-day critiques, the writing game, and live editor
snapshots**) are turned off on a plain Netlify deploy. Those pages notice the
missing server and show a short message explaining why. Everything else (editor,
publishing, library, stories, vocab, auth, account) works normally.

To enable realtime in production:

1. Deploy `server/index.ts` to an always-on host like Render, Railway, or Fly.io.
   Start command: `npm run realtime` (needs the same `DATABASE_URL`).
2. In Netlify, set `NEXT_PUBLIC_REALTIME_URL` to that server’s URL and redeploy.
3. On the realtime host, set `APP_BASE_URL` to your Netlify URL so its CORS
   allowlist accepts the browser origin.

---

## Auth notes

Sessions are stateless signed JWTs in an httpOnly cookie (`AUTH_SECRET`), so
they work across serverless invocations. Signup is a two-step email-code flow;
without SMTP configured, the code is returned to the client for local testing.

