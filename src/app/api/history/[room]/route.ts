import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { readLiveToken } from "@/lib/live-token";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(
  req: Request,
  { params }: { params: Promise<{ room: string }> },
) {
  const session = await getSession();
  const identity = session
    ? { id: session.userId }
    : readLiveToken(req.headers.get("authorization")?.replace(/^Bearer /, ""));
  if (!identity)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const room = await prisma.room.findUnique({
    where: { slug: (await params).room },
  });
  if (!room || !room.memberIds.includes(identity.id))
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  const rows = await prisma.message.findMany({
    where: { roomId: room.id },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json(
    rows
      .reverse()
      .map((m) => ({
        id: m.id,
        fromId: m.userId,
        from: m.user.name,
        text: m.text,
        at: m.createdAt.getTime(),
      })),
    { headers: { "Cache-Control": "no-store" } },
  );
}
