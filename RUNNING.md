# Run Writers’ Workshop on Mac and iPhone

## Install the hosted app

Open the permanent app URL in Safari. On iPhone choose **Share > Add to Home
Screen**. On Mac choose **File > Add to Dock**. Open that icon before writing
so you use the installed app's saved draft. Closing it keeps your writing.
After it has loaded once, you can keep drafting offline. **Install app** in
the app's footer includes the same steps.

In Write, **Save a backup** downloads your current draft and genres.
**Restore a backup** opens that file on another device. Passwords and player
credentials are not included. Private browsing and clearing app data can remove
local drafts, so retain a backup before doing either.

Chats, critiques, games, shared drafts and published stories use the permanent
PostgreSQL database and require an internet connection. Guest identities return
on the same device; sign in to return to an account on another device. Guest
device credentials expire after a year of inactivity for security.

Deployment is deferred while the Netlify team is paused. The local and Codespaces
steps below are for development, not the public app's normal installation.

## Mac

Install Node.js 22 and PostgreSQL 16 or later. Clone this repository, or
download its ZIP from the Code menu.

```sh
git clone https://github.com/gwilltsherman-byte/writers-workshop.git
cd writers-workshop
cp .env.example .env
```

Create a PostgreSQL database named `writers_workshop`. Set `DATABASE_URL` in
`.env` to its connection string. Set `AUTH_SECRET` to the output of
`openssl rand -base64 32`. These values stay local and are ignored by Git.

```sh
npm ci
npm run migrate:deploy
npm run dev
```

Open `http://localhost:3000`. Keep Terminal open; Control-C stops the app.
The website, chat, critiques, games and shared drafts all use this same server.
Guest identities persist on a device and are shared across its tabs. Use
two different browsers or devices to test two players. Signed-in accounts use
the same player identity across their tabs.

SMTP is optional in development. Without it, signup shows a development-only
verification code in the signup form. Set SMTP values to test real delivery.

## iPhone on your Wi-Fi

Keep the Mac awake and connect both devices to the same Wi-Fi. Find the Mac's
IP address in System Settings, Wi-Fi, Details, TCP/IP. Stop the app and run:

```sh
APP_BASE_URL=http://MAC_IP:3000 npm run dev
```

Replace `MAC_IP` with that address. Open `http://MAC_IP:3000` in iPhone Safari.
The server listens on the network, so players on the phone and Mac can join
one lobby and play each other. Allow Node through the Mac firewall if needed.
The Mac must remain awake and the server must keep running.

## Netlify

The permanent app uses Netlify for the website and API, plus PostgreSQL for
shared state. Follow [DEPLOYMENT.md](DEPLOYMENT.md) after the team's deployment
pause is resolved. This version has not been deployed yet.

Open the final Netlify URL in a Mac browser or iPhone Safari. On iPhone choose
Share, Add to Home Screen for a shortcut. Use the same game invite link to join
friends. Guest sessions return on this device; sign in to use an account on
another device. Chat and game activity is shared through the database.

## GitHub Codespaces

Open https://codespaces.new/gwilltsherman-byte/writers-workshop and create a
codespace. The included setup creates PostgreSQL, applies migrations and starts
the app. Open forwarded port 3000. Keep the port private; sign in with the same
GitHub account on the phone to open it. It runs while the codespace is active.
