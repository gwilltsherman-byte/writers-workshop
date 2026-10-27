// Single source of truth for the profanity filter, shared by the server
// (server/index.ts) and the client so the word list can't drift out of sync.
export const BAD_WORDS = ["fuck", "shit", "bitch"] as const;

const PATTERN = new RegExp(`\\b(?:${BAD_WORDS.join("|")})\\b`, "gi");

/** Mask profane words with asterisks. Safe to run on the server and client. */
export function clean(text: string): string {
  return String(text ?? "").replace(PATTERN, (w) => "*".repeat(w.length));
}

// Backwards-compatible alias for existing client imports.
export const cleanClient = clean;
