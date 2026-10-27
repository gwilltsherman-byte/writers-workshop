import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = String(searchParams.get("q") || "")
    .trim()
    .toLowerCase();
  const genre = String(searchParams.get("genre") || "")
    .trim()
    .toLowerCase();
  const limit = Math.min(
    100,
    Math.max(1, Number(searchParams.get("limit")) || 100),
  );

  const where: Record<string, unknown> = {};
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { authorName: { contains: q, mode: "insensitive" } },
    ];
  }
  if (genre) {
    const knownGenres = [
      "Fiction",
      "Fantasy",
      "Sci-Fi",
      "Poetry",
      "Essay",
      "Mystery",
      "Romance",
      "Non-fiction",
      "Horror",
      "Humor",
    ];
    const canonical = knownGenres.find((g) => g.toLowerCase() === genre);
    where.genres = {
      hasSome: Array.from(
        new Set([genre, canonical || searchParams.get("genre")!.trim()]),
      ),
    };
  }

  const items = await prisma.story.findMany({
    where,
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
  return NextResponse.json({ items });
}
