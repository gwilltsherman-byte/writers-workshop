import { readDraft, writeDraft, draftBackup, parseDraftBackup } from './draft-storage.js';
const title = document.querySelector('#draft-title');
const body = document.querySelector('#draft-body');
const status = document.querySelector('#save-status');
let genres = [];
try { const draft = readDraft(localStorage); title.value = draft.title; body.value = draft.html; genres = draft.genres; status.textContent = 'Saved on this device'; }
catch { status.textContent = 'The saved draft could not be opened. Its original copy is still kept; restore a backup before editing.'; }
const current = () => ({ title: title.value, html: body.value, genres });
function save() {
  try { writeDraft(localStorage, current()); status.textContent = 'Saved on this device'; }
  catch { status.textContent = 'Could not save. Download a backup before closing this app.'; }
}
title.addEventListener('input', save); body.addEventListener('input', save);
document.addEventListener('pointerdown', () => { navigator.storage?.persist?.().catch(() => {}); }, { once: true });
document.querySelector('#backup-save').addEventListener('click', () => {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(draftBackup(current()))], { type: 'application/json' }));
  a.download = 'workshop-draft-backup.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 60000);
});
document.querySelector('#backup-file').addEventListener('change', async event => {
  const file = event.target.files[0]; if (!file) return;
  try {
    if (file.size > 2_000_000) throw new Error('The backup is too large.');
    const draft = parseDraftBackup(await file.text());
    if (!confirm('Replace the draft on this device? Save a backup of your current writing first.')) return;
    writeDraft(localStorage, draft); title.value = draft.title; body.value = draft.html; genres = draft.genres;
    status.textContent = 'Backup restored and saved on this device';
  } catch (error) { status.textContent = error.message; }
  event.target.value = '';
});
