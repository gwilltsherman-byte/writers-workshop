import { spawnSync } from "node:child_process";
import { getConnectionString } from "@netlify/database";

if (process.env.NETLIFY_DB_URL)
  process.env.DATABASE_URL = getConnectionString();
if (!process.env.DATABASE_URL)
  throw new Error(
    "Enable Netlify Database or set DATABASE_URL before deploying Writers' Workshop.",
  );
if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32)
  throw new Error(
    "Set AUTH_SECRET to a random value of at least 32 characters in Netlify's environment settings.",
  );
for (const [entry, args] of [
  ["node_modules/prisma/build/index.js", ["generate"]],
  ["node_modules/prisma/build/index.js", ["migrate", "deploy"]],
  ["node_modules/next/dist/bin/next", ["build", "--webpack"]],
]) {
  const r = spawnSync(process.execPath, [entry, ...args], {
    stdio: "inherit",
    env: process.env,
  });
  if (r.error) throw r.error;
  if (r.status !== 0) process.exit(r.status || 1);
}
