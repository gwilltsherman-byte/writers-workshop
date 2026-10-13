import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import {
  SESSION_COOKIE,
  signSession,
  sessionCookieOptions,
  setSessionCookieValue,
} from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { email, code, name, password } = body || {};
  if (!email || !code || !name || !password) {
    return NextResponse.json({ error: "Required" }, { status: 400 });
  }

  const vc = await prisma.verifyCode.findFirst({
    where: { email, purpose: "signup", usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!vc) return NextResponse.json({ error: "Invalid or expired code." }, { status: 400 });

  const ok = await bcrypt.compare(String(code), vc.codeHash);
  if (!ok) return NextResponse.json({ error: "Invalid code." }, { status: 400 });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.upsert({
    where: { email },
    update: { name, passwordHash, emailVerifiedAt: new Date() },
    create: { email, name, passwordHash, emailVerifiedAt: new Date() },
  });
  await prisma.verifyCode.update({ where: { id: vc.id }, data: { usedAt: new Date() } });

  const token = signSession({ userId: user.id, email: user.email, name: user.name });
  const res = NextResponse.json({ ok: true, name: user.name });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(setSessionCookieValue));
  return res;
}
