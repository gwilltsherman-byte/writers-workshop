import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// [word, definition] pairs from a cleaned Webster's 1913 (public domain).
type Entry = [string, string];

// Loaded once per warm function instance and cached on globalThis.
const g = globalThis as unknown as { __wwDict?: Entry[] };

async function loadDict(): Promise<Entry[]> {
  if (g.__wwDict) return g.__wwDict;
  const file = path.join(process.cwd(), "src", "data", "dictionary.json");
  const txt = await fs.readFile(file, "utf8");
  g.__wwDict = JSON.parse(txt) as Entry[];
  return g.__wwDict;
}

const rnd = (n: number) => Math.floor(Math.random() * n);

function makeQuestion(dict: Entry[]) {
  const [word, answer] = dict[rnd(dict.length)];
  const opts = new Set<string>([answer]);
  let guard = 0;
  while (opts.size < 4 && guard++ < 60) {
    const d = dict[rnd(dict.length)][1];
    if (d !== answer) opts.add(d);
  }
  const options = [...opts];
  for (let i = options.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
    [options[i], options[j]] = [options[j], options[i]];
  }
  return { word, answer, options };
}

export async function GET(req: Request) {
  try {
    const dict = await loadDict();
    const { searchParams } = new URL(req.url);
    const n = Math.min(30, Math.max(1, Number(searchParams.get("n") || 12)));
    const questions = Array.from({ length: n }, () => makeQuestion(dict));
    return NextResponse.json({ count: dict.length, questions });
  } catch {
    return NextResponse.json({ error: "vocab_unavailable" }, { status: 500 });
  }
}
