export const DRAFT_KEY = 'ww-editor-draft';
export function cleanDraft(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)
      || typeof value.title !== 'string' || value.title.length > 500
      || typeof value.html !== 'string' || value.html.length > 1_000_000
      || !Array.isArray(value.genres) || value.genres.length > 20
      || !value.genres.every(g => typeof g === 'string' && g.length <= 80)) {
    throw new Error('Choose a valid Writers’ Workshop draft backup.');
  }
  return { title: value.title, html: value.html, genres: [...value.genres] };
}
export function readDraft(storage) {
  const raw = storage.getItem(DRAFT_KEY);
  return raw ? cleanDraft(JSON.parse(raw)) : { title: '', html: '', genres: [] };
}
export function writeDraft(storage, draft) {
  storage.setItem(DRAFT_KEY, JSON.stringify(cleanDraft(draft)));
}
export function draftBackup(draft) {
  return { app: 'writers-workshop', version: 1, saved: new Date().toISOString(), draft: cleanDraft(draft) };
}
export function parseDraftBackup(text) {
  if (typeof text !== 'string' || text.length > 2_000_000) throw new Error('The backup is too large.');
  const value = JSON.parse(text);
  if (value?.app !== 'writers-workshop' || value.version !== 1) throw new Error('Choose a Writers’ Workshop draft backup.');
  return cleanDraft(value.draft);
}
