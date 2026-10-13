import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

// Sessions use a signed JWT in an httpOnly cookie. Each request verifies the
// token without relying on shared memory between serverless invocations.
const SECRET =
  process.env.AUTH_SECRET ||
  (process.env.NODE_ENV === "production"
    ? // Fail loudly in prod rather than silently signing with a known key.
      ""
    : "dev-insecure-secret-change-me");

export const SESSION_COOKIE = "ww_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type SessionUser = { userId: string; email: string; name: string };

export function signSession(user: SessionUser): string {
  if (!SECRET) throw new Error("AUTH_SECRET is not set");
  return jwt.sign(user, SECRET, { expiresIn: "7d" });
}

/** Read + verify the session cookie for the current request (server only). */
export async function getSession(): Promise<SessionUser | null> {
  if (!SECRET) return null;
  try {
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    if (!token) return null;
    const payload = jwt.verify(token, SECRET) as jwt.JwtPayload & Partial<SessionUser>;
    if (!payload?.userId || !payload.email || !payload.name) return null;
    return { userId: payload.userId, email: payload.email, name: payload.name };
  } catch {
    return null;
  }
}

/** Cookie options shared by "set" and "clear" so they always match. */
export function sessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export const setSessionCookieValue = MAX_AGE_SECONDS;
