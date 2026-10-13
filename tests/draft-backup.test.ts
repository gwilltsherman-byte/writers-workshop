import test from 'node:test';
import assert from 'node:assert/strict';
import { readDraft, writeDraft, draftBackup, parseDraftBackup } from '../public/draft-storage.js';
import { signGuestToken, readGuestToken, readLiveToken } from '../src/lib/live-token';

test('draft text and genres reopen and restore without exporting a login or player token', () => {
  const entries = new Map<string, string>();
  const storage = { getItem: (key: string) => entries.get(key) ?? null, setItem: (key: string, value: string) => { entries.set(key, value); } };
  const draft = { title: 'Saved writing', html: 'A paragraph\nwith two lines.', genres: ['Poetry'] };
  writeDraft(storage, draft);
  assert.deepEqual(readDraft(storage), draft);
  const backup = JSON.stringify(draftBackup(draft));
  assert.deepEqual(parseDraftBackup(backup), draft);
  assert.equal(backup.includes('token'), false);
  assert.throws(() => parseDraftBackup(JSON.stringify({ app: 'foreign', version: 1, draft })));
  assert.throws(() => parseDraftBackup(JSON.stringify({ app: 'writers-workshop', version: 2, draft })));
  assert.throws(() => parseDraftBackup(JSON.stringify({ app: 'writers-workshop', version: 1, draft: { ...draft, genres: [null] } })));
});
test('storage failure is reported instead of returning a saved result', () => {
  assert.throws(() => writeDraft({ setItem() { throw new Error('quota'); } }, { title: '', html: 'Keep this writing', genres: [] }));
});
test('guest device tokens retain identity but cannot serve as a live ticket or account token', () => {
  process.env.AUTH_SECRET = 'test-secret-for-guest-device-at-least-32-characters';
  const guest = { id: 'guest:test-id', name: 'Saved guest' };
  const token = signGuestToken(guest);
  assert.deepEqual(readGuestToken(token), guest);
  assert.equal(readLiveToken(token), null);
  assert.equal(readGuestToken(token + 'changed'), null);
  assert.throws(() => signGuestToken({ id: 'account-id', name: 'Account' }));
});
