import assert from "node:assert/strict";
import { createServer } from "node:net";
import { randomBytes } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import EmbeddedPostgres from "embedded-postgres";

async function main() {
  const dir = await mkdtemp(join(tmpdir(), "workshop-preview-"));
  const pg = new EmbeddedPostgres({
    databaseDir: join(dir, "db"),
    port: 55440,
    user: "postgres",
    password: "preview-only",
    persistent: false,
    onLog: () => {},
    onError: () => {},
  });
  const mail: string[] = [];
  const smtp = createServer((socket) => {
    socket.setEncoding("utf8");
    socket.write("220 local-test SMTP\r\n");
    let buffer = "",
      message = "",
      data = false;
    socket.on("data", (chunk) => {
      buffer += chunk;
      let end;
      while ((end = buffer.indexOf("\r\n")) >= 0) {
        const line = buffer.slice(0, end);
        buffer = buffer.slice(end + 2);
        if (data) {
          if (line === ".") {
            mail.push(message);
            message = "";
            data = false;
            socket.write("250 accepted\r\n");
          } else message += line + "\n";
          continue;
        }
        if (/^EHLO|^HELO/.test(line)) socket.write("250 local-test\r\n");
        else if (/^DATA/.test(line)) {
          data = true;
          socket.write("354 send message\r\n");
        } else if (/^QUIT/.test(line)) socket.end("221 bye\r\n");
        else socket.write("250 OK\r\n");
      }
    });
  });
  let web: ReturnType<typeof spawn> | undefined;
  async function cleanup() {
    web?.kill("SIGTERM");
    await new Promise<void>((r) => smtp.close(() => r()));
    await pg.stop();
    await rm(dir, { recursive: true, force: true });
  }
  process.once("SIGTERM", () => {
    void cleanup().then(() => process.exit(0));
  });
  process.once("SIGINT", () => {
    void cleanup().then(() => process.exit(0));
  });
  try {
    await pg.initialise();
    await pg.start();
    await pg.createDatabase("preview");
    const env = {
      ...process.env,
      DATABASE_URL:
        "postgresql://postgres:preview-only@127.0.0.1:55440/preview?schema=public",
      AUTH_SECRET: randomBytes(32).toString("hex"),
      APP_BASE_URL: "http://localhost:3006",
      SMTP_HOST: "127.0.0.1",
      SMTP_PORT: "25265",
      SMTP_USER: "",
      SMTP_PASS: "",
      SMTP_FROM: "Workshop <test@local.invalid>",
      NODE_ENV: "production" as const,
    };
    const migration = spawnSync(
      process.execPath,
      ["node_modules/prisma/build/index.js", "migrate", "deploy"],
      { env, encoding: "utf8" },
    );
    assert.equal(migration.status, 0, migration.stdout + migration.stderr);
    await new Promise<void>((r) => smtp.listen(25265, "127.0.0.1", () => r()));
    web = spawn(
      process.execPath,
      [
        "node_modules/next/dist/bin/next",
        "start",
        "--port",
        "3006",
        "--hostname",
        "127.0.0.1",
      ],
      { env, stdio: ["ignore", "pipe", "pipe"] },
    );
    web?.stderr?.on("data", (d) => process.stderr.write(d));
    let ready = false;
    for (let i = 0; i < 100; i++) {
      try {
        if ((await fetch("http://localhost:3006/api/health")).ok) {
          ready = true;
          break;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 200));
    }
    assert.equal(ready, true, "The production server did not start.");
    async function request(
      path: string,
      body?: unknown,
      token?: string,
      cookie?: string,
    ) {
      const res = await fetch(`http://localhost:3006${path}`, {
        method: body === undefined ? "GET" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(cookie ? { Cookie: cookie } : {}),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      const data = await res.json();
      return { res, data };
    }
    const account = {
      email: "player@local.invalid",
      name: "Local Writer",
      password: "Local-test-password-123",
    };
    let r = await request("/api/auth/signup", account);
    assert.equal(r.res.status, 200);
    assert.equal(
      r.data.devCode,
      undefined,
      "Production must never return email codes.",
    );
    const code = mail.at(-1)?.match(/code is (\d{6})/)?.[1];
    assert.ok(code, "Verification mail must reach the local test mailbox.");
    r = await request("/api/auth/verify", { ...account, code });
    assert.equal(r.res.status, 200);
    let cookie = r.res.headers.get("set-cookie")!.split(";")[0];
    assert.equal(
      (await request("/api/me", undefined, undefined, cookie)).data.name,
      account.name,
    );
    const published = await request(
      "/api/stories",
      {
        title: "Smoke test story",
        html: "A real published story.",
        genres: ["Fiction"],
      },
      undefined,
      cookie,
    );
    assert.equal(published.res.status, 200);
    assert.equal(
      (await request(`/api/stories/${published.data.id}`)).data.story.title,
      "Smoke test story",
    );
    assert.equal(
      (await request("/api/library", undefined, undefined, cookie)).data.stories
        .length,
      1,
    );
    assert.equal(
      (
        await request("/api/auth/login", {
          email: account.email,
          password: account.password,
        })
      ).res.status,
      200,
    );
    assert.equal(
      (await request("/api/auth/verify", { ...account, code })).res.status,
      409,
    );
    assert.equal(
      (
        await request(
          "/api/account/change-password",
          {
            currentPassword: account.password,
            newPassword: "Changed-local-password-123",
          },
          undefined,
          cookie,
        )
      ).res.status,
      200,
    );
    assert.equal(
      (
        await request("/api/auth/login", {
          email: account.email,
          password: "Changed-local-password-123",
        })
      ).res.status,
      200,
    );
    assert.equal(
      (
        await request(
          "/api/account/request-email-change",
          { newEmail: "updated-player@local.invalid" },
          undefined,
          cookie,
        )
      ).res.status,
      200,
    );
    const emailCode = mail.at(-1)?.match(/code is (\d{6})/)?.[1];
    assert.ok(emailCode);
    const changed = await request(
      "/api/account/confirm-email-change",
      { newEmail: "updated-player@local.invalid", code: emailCode },
      undefined,
      cookie,
    );
    assert.equal(changed.res.status, 200);
    cookie = changed.res.headers.get("set-cookie")!.split(";")[0];
    assert.equal(
      (await request("/api/me", undefined, undefined, cookie)).data.email,
      "updated-player@local.invalid",
    );
    assert.equal(
      (await request("/api/library", undefined, undefined, cookie)).data.stories
        .length,
      1,
    );
    assert.equal((await request("/api/vocab/random")).res.status, 200);
    const alice = (await request("/api/realtime/session", {})).data,
      bob = (await request("/api/realtime/session", {})).data;
    assert.notEqual(alice.id, bob.id);
    assert.equal(
      (await request("/api/realtime/session", { token: alice.token })).data.id,
      alice.id,
    );
    await request(
      "/api/live",
      { mode: "chat:live", action: "join" },
      alice.token,
    );
    const paired = await request(
      "/api/live",
      { mode: "chat:live", action: "join" },
      bob.token,
    );
    const room = paired.data.room;
    assert.ok(room);
    assert.equal(
      (
        await request(
          "/api/live",
          {
            mode: "chat:live",
            room,
            action: "message",
            payload: { text: "Hello from another browser." },
          },
          alice.token,
        )
      ).res.status,
      200,
    );
    const seen = await request(
      "/api/live",
      { mode: "chat:live", room },
      bob.token,
    );
    assert.equal(seen.data.messages[0].text, "Hello from another browser.");
    assert.equal(
      (
        await request(
          `/api/history/${encodeURIComponent(room)}`,
          undefined,
          bob.token,
        )
      ).data[0].fromId,
      alice.id,
    );
    assert.equal(
      (await request(`/api/history/${encodeURIComponent(room)}`)).res.status,
      401,
    );
    assert.equal(
      (await request("/api/live", { mode: "game", action: "join" })).res.status,
      401,
    );
    console.log(
      "Production HTTP smoke checks passed: signup email, verification, login, publishing, library, vocabulary, guest identities, chat and private history.",
    );
    console.log("Local preview ready: http://localhost:3006");
    if (process.argv.includes("--preview")) await new Promise(() => {});
    else await cleanup();
  } catch (e) {
    await cleanup();
    throw e;
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
