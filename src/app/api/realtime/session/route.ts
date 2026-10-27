import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { readLiveToken, signLiveToken, readGuestToken, signGuestToken } from "@/lib/live-token";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  const me = await getSession();
  const body = await req.json().catch(() => ({}));
  const savedGuest = readGuestToken((await cookies()).get("ww-guest-device")?.value);
  let identity = me
    ? { id: me.userId, name: me.name }
    : savedGuest || readLiveToken(body.token);
  // Guest sessions are issued by the server, never by a client-supplied name.
  if (!identity || (!me && !identity.id.startsWith("guest:"))) {
    const id = randomUUID();
    identity = { id: `guest:${id}`, name: `Writer ${id.slice(0, 8)} (guest)` };
  }
  if (identity.id.startsWith("guest:")) {
    await prisma.user.upsert({
      where: { id: identity.id },
      update: {},
      create: {
        id: identity.id,
        name: identity.name,
        email: `${identity.id.slice(6)}@guest.invalid`,
      },
    });
  }
  const response = NextResponse.json(
    { ...identity, token: signLiveToken(identity) },
    { headers: { "Cache-Control": "no-store" } },
  );
  if (identity.id.startsWith("guest:")) response.cookies.set("ww-guest-device", signGuestToken(identity), {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 365 * 24 * 60 * 60,
  });
  return response;
}
