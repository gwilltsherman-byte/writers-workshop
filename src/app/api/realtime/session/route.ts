import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { readLiveToken, signLiveToken } from "@/lib/live-token";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  const me = await getSession();
  const body = await req.json().catch(() => ({}));
  let identity = me
    ? { id: me.userId, name: me.name }
    : readLiveToken(body.token);
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
  return NextResponse.json(
    { ...identity, token: signLiveToken(identity) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
