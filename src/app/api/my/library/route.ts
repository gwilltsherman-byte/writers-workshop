import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Used by the Profile page.
export async function GET() {
  const me = await getSession();
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const stories = await prisma.story.findMany({
    where: { authorName: me.name },
    orderBy: { createdAt: "desc" },
  });
  const docs = await prisma.myDoc.findMany({
    where: { userId: me.userId },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ stories, docs });
}
