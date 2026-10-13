import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const story = await prisma.story.findUnique({ where: { id: String(params.id) } });
  if (!story) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ story });
}
