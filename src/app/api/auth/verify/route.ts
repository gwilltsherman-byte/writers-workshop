import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { verifyInput } from "@/lib/auth-input";
import {
  SESSION_COOKIE,
  signSession,
  sessionCookieOptions,
  setSessionCookieValue,
} from "@/lib/session";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  const input = verifyInput.safeParse(await req.json().catch(() => null));
  if (!input.success)
    return NextResponse.json(
      { error: "Enter a valid email, name, password and six-digit code." },
      { status: 400 },
    );
  const { email, name, password, code } = input.data;
  try {
    const result = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${email}))`;
      const existing = await tx.user.findUnique({ where: { email } });
      if (existing?.emailVerifiedAt)
        return {
          error: "This email is already registered. Please log in.",
          status: 409,
        };
      const vc = await tx.verifyCode.findFirst({
        where: {
          email,
          purpose: "signup",
          usedAt: null,
          attempts: { lt: 5 },
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: "desc" },
      });
      if (!vc) return { error: "Invalid or expired code.", status: 400 };
      if (!(await bcrypt.compare(code, vc.codeHash))) {
        await tx.verifyCode.update({
          where: { id: vc.id },
          data: { attempts: { increment: 1 } },
        });
        return { error: "Invalid code.", status: 400 };
      }
      const passwordHash = await bcrypt.hash(password, 10);
      const user = await tx.user.upsert({
        where: { email },
        update: { name, passwordHash, emailVerifiedAt: new Date() },
        create: { email, name, passwordHash, emailVerifiedAt: new Date() },
      });
      await tx.verifyCode.update({
        where: { id: vc.id },
        data: { usedAt: new Date() },
      });
      return { user };
    });
    if ("error" in result)
      return NextResponse.json(
        { error: result.error },
        { status: result.status },
      );
    const res = NextResponse.json({ ok: true, name: result.user.name });
    res.cookies.set(
      SESSION_COOKIE,
      signSession({
        userId: result.user.id,
        email: result.user.email,
        name: result.user.name,
      }),
      sessionCookieOptions(setSessionCookieValue),
    );
    return res;
  } catch (e) {
    if ((e as { code?: string }).code === "P2002")
      return NextResponse.json(
        { error: "That writer name is taken." },
        { status: 409 },
      );
    console.error("[auth] Verification failed", e);
    return NextResponse.json(
      { error: "Could not create your account. Try again." },
      { status: 500 },
    );
  }
}
