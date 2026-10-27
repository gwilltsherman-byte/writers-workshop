import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "./db";

// Sessions use a signed JWT in an httpOnly cookie. Its stable userId identifies
// the account; current profile fields come from the database on each request.
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
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  let userId: string;
  try {
    const payload = jwt.verify(token, SECRET);
    if (
      typeof payload === "string" ||
      typeof payload.userId !== "string" ||
      !payload.userId
    )
      return null;
    userId = payload.userId;
  } catch {
    return null;
  }
  // Keep lookup errors outside the invalid-token catch: a database outage is
  // a server failure, not a reason to treat an authenticated writer as a guest.
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true },
  });
  return user ? { userId: user.id, email: user.email, name: user.name } : null;
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
