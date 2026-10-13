export type PresenceEvent = { type: "join" | "leave"; name: string };
export type ChatMessage = { id: string; from: string; text: string; at: number };
