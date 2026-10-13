import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { hashCode, makeSixDigitCode, sendCode } from "@/lib/mailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const me = getSession();
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const newEmail = String(body?.newEmail || "").trim().toLowerCase();
  if (!newEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(newEmail)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  const taken = await prisma.user.findUnique({ where: { email: newEmail } });
  if (taken) return NextResponse.json({ error: "That email is already in use." }, { status: 409 });

  const code = makeSixDigitCode();
  const codeHash = await hashCode(code);
  await prisma.emailChange.upsert({
    where: { userId_newEmail: { userId: me.userId, newEmail } },
    update: { codeHash, expiresAt: new Date(Date.now() + 15 * 60 * 1000), usedAt: null },
    create: {
      userId: me.userId,
      newEmail,
      codeHash,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    },
  });

  const { devCode } = await sendCode({ to: newEmail, code, subject: "Confirm your new email" });
  return NextResponse.json({ ok: true, ...(devCode ? { devCode } : {}) });
}
