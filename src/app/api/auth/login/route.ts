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
  const { email, password } = body || {};
  if (!email || !password) return NextResponse.json({ error: "Required" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.passwordHash) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });

  const token = signSession({ userId: user.id, email: user.email, name: user.name });
  const res = NextResponse.json({ ok: true, name: user.name });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(setSessionCookieValue));
  return res;
}
