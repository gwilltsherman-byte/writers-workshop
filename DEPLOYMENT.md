# Deploy Writers’ Workshop on Netlify

The app is prepared for Netlify. Deployment is intentionally deferred until
the team's paused deployment access is restored. No billing change, database
purchase or live deployment was made as part of the repair.

## Connect the private source repository

Use the existing Writers’ Workshop Netlify project and connect its production
branch to `gwilltsherman-byte/writers-workshop`, branch `main`. The previous
repository is now named `writers-workshop-backup`; confirm the Git connection
before publishing this version.

The included `netlify.toml` uses `npm run build:netlify`, publishes `.next`, and
loads the official `@netlify/plugin-nextjs` adapter. Use Node.js 22. Keep source
private. Next.js API routes run as Netlify Functions; there is no separate chat
or game host to provision.

## Database and environment

Enable Netlify Database for the project, or retain an existing PostgreSQL
connection in `DATABASE_URL`. Netlify Database provides `NETLIFY_DB_URL`; the
app uses `@netlify/database` to select the correct production or preview branch.
Use a dedicated database branch for deploy previews, not the production database.

Set these environment values for builds and Functions:

| Variable | Value |
| --- | --- |
| `AUTH_SECRET` | A random value of at least 32 characters. Generate locally with `openssl rand -base64 32`. |
| `APP_BASE_URL` | The project's final HTTPS URL. |
| `DATABASE_URL` | Required only when using an external PostgreSQL database. |
| `SMTP_HOST` | Your email service's SMTP host, for account signup and email changes. |
| `SMTP_PORT` | Usually 587; 465 enables implicit TLS. |
| `SMTP_USER`, `SMTP_PASS` | Email service credentials, when required. |
| `SMTP_FROM` | A sender address approved by that email service. |

Store secret values in Netlify's environment settings, never in the repository.

For pull-request previews, explicitly configure `AUTH_SECRET` in the
**Deploy Previews** context with a securely generated value of at least 32
characters. It must be available to both **Builds** and **Functions**. A value
configured only for **Production** does not fill a blank preview-context value.
Use a separate preview secret and preserve the production value. Changing the
preview secret invalidates existing preview login sessions. Retry the failed
pull-request deploy after saving the configuration.

The error `Set AUTH_SECRET to a random value of at least 32 characters` comes
from the deployment preflight, before migrations or Next.js compilation. Keep
this check; a successful local `npm run build` alone does not validate Netlify's
context-specific environment configuration.

Guest chat, critique, games and shared drafts work without SMTP. Production
email signup reports that email is not configured if SMTP is missing; it never
exposes a verification code. Account publishing requires signup or an existing
account.

The build script validates database and session configuration, generates the
Prisma client, applies `prisma migrate deploy`, and builds the app. Existing
records are retained. Before applying migrations to an existing production
database, take a database backup and verify its migration history. Legacy rooms
without player membership are not made public by the new room APIs.

## Publish and check

Once Netlify permits deployments again, trigger a production deploy. Check
`/api/health`, then open the app in two separate browsers or two guest tabs.

1. Open Chat in both sessions and choose Find a partner. Send a message each
   way, then reload one session and confirm that the messages remain.
2. Open Game in both sessions, join the same lobby, and start. Write and submit
   both pieces, vote, and continue through all three rounds to shared scores.
3. Create a friend room and open its link in another session.
4. Exchange critiques and check that actual feedback reaches the other writer.
5. Sign up through the configured email service, log in, and publish a story.
6. Create a shared draft, invite another writer, and verify that conflicting
   saves require reviewing the newer version.

Live synchronization uses Netlify requests and function compute. It uses the
existing plan's allowances; monitor Usage & billing after publication. No
additional paid host is required by this implementation.
