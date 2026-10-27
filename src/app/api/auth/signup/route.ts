import { signupInput } from "@/lib/auth-input";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashCode, makeSixDigitCode, sendCode } from "@/lib/mailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const input = signupInput.safeParse(await req.json().catch(() => null));
  if (!input.success)
    return NextResponse.json(
      {
        error:
          "Enter a valid email and writer name, and a password of 8–128 characters.",
      },
      { status: 400 },
    );
  const { email, name } = input.data;
  const taken = await prisma.user.findUnique({ where: { name } });
  if (taken && taken.email !== email)
    return NextResponse.json(
      { error: "That writer name is taken." },
      { status: 409 },
    );
  if (process.env.NODE_ENV === "production" && !process.env.SMTP_HOST)
    return NextResponse.json(
      {
        error:
          "Email signup is not configured yet. You can still join chats and games as a guest.",
      },
      { status: 503 },
    );
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing?.emailVerifiedAt) {
    return NextResponse.json(
      { error: "Email already registered." },
      { status: 409 },
    );
  }

  const recent = await prisma.verifyCode.findFirst({
    where: {
      email,
      purpose: "signup",
      createdAt: { gt: new Date(Date.now() - 60000) },
    },
  });
  if (recent)
    return NextResponse.json(
      { error: "Please wait a minute before requesting another code." },
      { status: 429 },
    );
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

  const { devCode } = await sendCode({
    to: email,
    code,
    subject: "Your verification code",
  });
  return NextResponse.json({ ok: true, ...(devCode ? { devCode } : {}) });
}
