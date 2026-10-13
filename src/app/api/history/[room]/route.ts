import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { room: string } }) {
  try {
    const room = await prisma.room.findUnique({ where: { slug: params.room } });
    if (!room) return NextResponse.json([]);
    const rows = await prisma.message.findMany({
      where: { roomId: room.id },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
      take: 100,
    });
    return NextResponse.json(
      rows.map((r) => ({
        id: r.id,
        from: r.user.name,
        text: r.text,
        at: new Date(r.createdAt).getTime(),
      }))
    );
  } catch {
    return NextResponse.json({ error: "history_failed" }, { status: 500 });
  }
}
