import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const me = getSession();
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const stories = await prisma.story.findMany({
    where: { authorName: me.name },
    orderBy: { createdAt: "desc" },
  });
  const docs = await prisma.document.findMany({ orderBy: { updatedAt: "desc" }, take: 50 });
  return NextResponse.json({ stories, docs });
}
