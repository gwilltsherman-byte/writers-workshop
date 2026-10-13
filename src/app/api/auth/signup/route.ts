import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashCode, makeSixDigitCode, sendCode } from "@/lib/mailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { email, name, password } = body || {};
  if (!email || !name || !password) {
    return NextResponse.json({ error: "Required" }, { status: 400 });
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing?.emailVerifiedAt) {
    return NextResponse.json({ error: "Email already registered." }, { status: 409 });
  }

  const code = makeSixDigitCode();
  const codeHash = await hashCode(code);
  await prisma.verifyCode.create({
    data: {
      email,
      codeHash,
      purpose: "signup",
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    },
  });

  const { devCode } = await sendCode({ to: email, code, subject: "Your verification code" });
  return NextResponse.json({ ok: true, ...(devCode ? { devCode } : {}) });
}
