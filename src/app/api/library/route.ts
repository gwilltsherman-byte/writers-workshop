import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const me = await getSession();
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const stories = await prisma.story.findMany({
    where: { authorName: me.name },
    orderBy: { createdAt: "desc" },
  });
  const rooms = await prisma.room.findMany({ where: { type: "doc", memberIds: { has: me.userId } }, select: { slug: true } });
  const docs = await prisma.document.findMany({ where: { roomSlug: { in: rooms.map(r => r.slug) } }, orderBy: { updatedAt: "desc" }, take: 50 });
  return NextResponse.json({ stories, docs });
}
