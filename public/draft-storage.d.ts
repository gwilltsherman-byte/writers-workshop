export type Draft = { title: string; html: string; genres: string[] };
export const DRAFT_KEY: string;
export function cleanDraft(value: unknown): Draft;
export function readDraft(storage: Pick<Storage, 'getItem'>): Draft;
export function writeDraft(storage: Pick<Storage, 'setItem'>, draft: Draft): void;
export function draftBackup(draft: Draft): { app: string; version: number; saved: string; draft: Draft };
export function parseDraftBackup(text: string): Draft;
