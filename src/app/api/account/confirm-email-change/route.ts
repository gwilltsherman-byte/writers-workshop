import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import {
  SESSION_COOKIE,
  getSession,
  signSession,
  sessionCookieOptions,
  setSessionCookieValue,
} from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const me = await getSession();
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const newEmail = String(body?.newEmail || "")
    .trim()
    .toLowerCase();
  const code = String(body?.code || "");
  if (!newEmail || !code)
    return NextResponse.json({ error: "Required" }, { status: 400 });

  const ec = await prisma.emailChange.findUnique({
    where: { userId_newEmail: { userId: me.userId, newEmail } },
  });
  if (!ec || ec.usedAt || ec.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "Invalid or expired code." },
      { status: 400 },
    );
  }
  const ok = await bcrypt.compare(code, ec.codeHash);
  if (!ok)
    return NextResponse.json({ error: "Invalid code." }, { status: 400 });

  const user = await prisma.$transaction(async (tx) => {
    const current = await tx.user.findUniqueOrThrow({
      where: { id: me.userId },
    });
    const updated = await tx.user.update({
      where: { id: me.userId },
      data: { email: newEmail },
    });
    // Story ownership currently uses email. Move it with the account so a
    // confirmed email change never makes the writer's published work vanish.
    await tx.story.updateMany({
      where: { authorEmail: current.email },
      data: { authorEmail: newEmail },
    });
    await tx.emailChange.update({
      where: { id: ec.id },
      data: { usedAt: new Date() },
    });
    return updated;
  });

  // Refresh the session so the cookie carries the new email.
  const token = signSession({
    userId: user.id,
    email: user.email,
    name: user.name,
  });
  const res = NextResponse.json({ ok: true, email: user.email });
  res.cookies.set(
    SESSION_COOKIE,
    token,
    sessionCookieOptions(setSessionCookieValue),
  );
  return res;
}
