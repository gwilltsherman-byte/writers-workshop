import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";

// Lazily created transport, cached on globalThis so repeated function
// invocations reuse one connection pool. (`nodemailer` is shimmed as `any`.)
type Transport = { sendMail: (opts: Record<string, unknown>) => Promise<unknown> };
const g = globalThis as unknown as { __wwSmtp?: Transport | null };

export function getTransport(): Transport | null {
  if (g.__wwSmtp !== undefined) return g.__wwSmtp;
  if (!process.env.SMTP_HOST) {
    g.__wwSmtp = null;
    return null;
  }
  g.__wwSmtp = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
    secure: false,
  }) as Transport;
  return g.__wwSmtp;
}

export function makeSixDigitCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function hashCode(code: string): Promise<string> {
  return bcrypt.hash(code, 10);
}

/**
 * Send a verification code by email. When SMTP is not configured (local dev)
 * the code is logged and returned so it can be shown in the UI. In production
 * the code is never returned to the client.
 */
export async function sendCode(opts: {
  to: string;
  code: string;
  subject?: string;
}): Promise<{ sent: boolean; devCode?: string }> {
  const transporter = getTransport();
  const from = process.env.SMTP_FROM || "Writers Workshop <noreply@example.local>";
  const appUrl = process.env.APP_BASE_URL || "http://localhost:3000";
  const subject = opts.subject || "Your verification code";
  if (transporter) {
    await transporter.sendMail({
      from,
      to: opts.to,
      subject,
      text: `Your verification code is ${opts.code}. It expires in 15 minutes.\n\nOpen ${appUrl} to continue.`,
    });
    return { sent: true };
  }
  // eslint-disable-next-line no-console
  console.log(`[auth] DEV code for ${opts.to}: ${opts.code}`);
  return { sent: false, devCode: process.env.NODE_ENV === "production" ? undefined : opts.code };
}
