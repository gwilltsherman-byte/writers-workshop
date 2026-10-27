import type { GamePrompt } from "./prompts";
export type Mode =
  "chat:live" | "critique:short" | "critique:long" | "game" | "doc";
export type Player = {
  id: string;
  name: string;
  role: number;
  seenAt: number;
  left?: boolean;
};
export type PairState = {
  kind: "pair";
  mode: Mode;
  players: Player[];
  startedAt: number;
  endsAt: number;
  pieces: Record<string, { title: string; text: string }>;
  feedback: Record<string, string>;
  chatLive: boolean;
  chatRequestedBy?: string;
  endedReason?: string;
  left: string[];
};
export type GameState = {
  kind: "game";
  players: Player[];
  phase: "lobby" | "writing" | "voting" | "results";
  roundIndex: number;
  pair: [number, number] | null;
  prompt: GamePrompt | null;
  endsAt: number | null;
  drafts: Record<number, string>;
  submitted: string[];
  votes: Record<string, number>;
  score: Record<number, number>;
  roundResults: {
    pair: number[];
    drafts: Record<number, string>;
    tally: Record<number, number>;
    winners: number[];
  }[];
  private: boolean;
  writingMs: number;
  votingMs: number;
};
export type DocState = {
  kind: "doc";
  title: string;
  text: string;
  revision: number;
};
export type LiveSnapshot = {
  identity: { id: string; name: string };
  room: string | null;
  waiting: boolean;
  serverTime: number;
  state: PairState | GameState | DocState | null;
  messages: {
    id: string;
    fromId: string;
    from: string;
    text: string;
    at: number;
  }[];
};
