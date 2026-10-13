# Writers' Workshop

Write drafts, swap critiques, play writing games and publish stories to a shared
library. The app uses Next.js, PostgreSQL, Prisma, Socket.IO and Yjs.

## Run it on GitHub

Open [Writers' Workshop in Codespaces](https://codespaces.new/gwilltsherman-byte/writers-workshop).
Create the codespace and wait for setup. It creates a development database,
generates a session secret, installs dependencies and starts the app. Open port
3000 from the Ports panel. Keep it private and sign in to GitHub on your iPhone
to open the same address. The codespace must remain running.

GitHub Pages cannot run this app's API, database or live features. Codespaces
provides a GitHub development environment; permanent hosting needs a Node server
and PostgreSQL. The current framework needs a security update before a public production deployment. Use the private Codespace for now.
Production needs a database connection, a session secret and SMTP settings for
verification emails. No paid service or database is provisioned by these setup files.

## Run it on Mac

See [RUNNING.md](RUNNING.md) for installation and iPhone over Wi-Fi instructions.

```sh
cp .env.example .env
npm ci
npm run migrate
npm run dev
```

Set DATABASE_URL and AUTH_SECRET in .env before running those commands.
The development server includes live chat, critiques, games and editor snapshots.
In development, signup verification codes can be displayed without SMTP.

## Build for a Node host

```sh
npm run build
npm run start
```

The start command serves the site, API routes and live connections together.
Set APP_BASE_URL to its public HTTPS origin. Leave NEXT_PUBLIC_REALTIME_URL empty
for this single-server setup. Sessions use signed JWTs in httpOnly cookies.
