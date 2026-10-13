import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/stories?q=...  -> flat array (used by /explore)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = String(searchParams.get("q") || "").trim().toLowerCase();
  const where = q
    ? {
        OR: [
          { title: { contains: q, mode: "insensitive" as const } },
          { authorName: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};
  const items = await prisma.story.findMany({
    where,
    orderBy: { publishedAt: "desc" },
    take: 100,
  });
  return NextResponse.json(items);
}

// POST /api/stories -> publish a story (auth required)
export async function POST(req: Request) {
  const me = getSession();
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { title, html, genres } = body || {};
  if (!title || !html) {
    return NextResponse.json({ error: "title_and_html_required" }, { status: 400 });
  }
  const excerpt = String(html).replace(/\s+/g, " ").slice(0, 220);
  const story = await prisma.story.create({
    data: {
      title,
      html,
      excerpt,
      genres: Array.isArray(genres) ? genres : [],
      authorName: me.name,
      authorEmail: me.email,
    },
  });
  return NextResponse.json({ ok: true, id: story.id });
}
