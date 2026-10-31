import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { get, writable } from 'svelte/store';
import { openIdbStore } from './kv.ts';
import { bindPersisted } from './persisted.ts';

const flush = () => new Promise((r) => setTimeout(r, 20));

describe('persisted storage', () => {
  it('survives a reload (reopening the database)', async () => {
    const name = `test-${Math.random()}`;
    const a = writable({ totalPoints: 0 });
    await bindPersisted(openIdbStore(name), 'progress', a, { totalPoints: 0 });
    a.set({ totalPoints: 42 });
    await flush();

    const b = writable({ totalPoints: 0 });
    await bindPersisted(openIdbStore(name), 'progress', b, { totalPoints: 0 });
    expect(get(b)).toEqual({ totalPoints: 42 });
  });

  it('fills in defaults for missing fields', async () => {
    const kv = openIdbStore(`test-${Math.random()}`);
    await kv.set('settings', { a: 1 });
    const s = writable({ a: 0, b: 0 });
    await bindPersisted(kv, 'settings', s, { a: 0, b: 2 });
    expect(get(s)).toEqual({ a: 1, b: 2 });
  });
});
