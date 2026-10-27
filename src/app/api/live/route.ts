import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readLiveToken } from "@/lib/live-token";
import { liveAction, LiveError } from "@/lib/live-service";
import type { Mode } from "@/lib/live-types";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  if (
    origin &&
    origin !== new URL(req.url).origin &&
    origin !== process.env.APP_BASE_URL
  )
    return NextResponse.json({ error: "Untrusted origin." }, { status: 403 });
  const identity = readLiveToken(
    req.headers.get("authorization")?.replace(/^Bearer /, ""),
  );
  if (!identity)
    return NextResponse.json(
      { error: "Please reconnect your player session." },
      { status: 401 },
    );
  try {
    const body = await req.json();
    if (body === null || typeof body !== "object")
      throw new LiveError("Invalid request.");
    const result = await liveAction(prisma, identity, {
      mode: body.mode as Mode,
      room: body.room,
      action: body.action,
      payload: body.payload,
    });
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    if (e instanceof LiveError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("[live] Request failed", e);
    return NextResponse.json(
      { error: "The server could not save that action. Please try again." },
      { status: 500 },
    );
  }
}
