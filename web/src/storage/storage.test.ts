import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { get } from 'svelte/store';
import { openIdbStore } from './kv.ts';
import { persisted } from './persisted.ts';

const flush = () => new Promise((r) => setTimeout(r, 20));

describe('persisted storage', () => {
  it('survives a reload (reopening the database)', async () => {
    const name = `test-${Math.random()}`;
    const a = await persisted(openIdbStore(name), 'progress', { totalPoints: 0 });
    a.set({ totalPoints: 42 });
    await flush();

    const b = await persisted(openIdbStore(name), 'progress', { totalPoints: 0 });
    expect(get(b)).toEqual({ totalPoints: 42 });
  });

  it('fills in defaults for missing fields', async () => {
    const name = `test-${Math.random()}`;
    const kv = openIdbStore(name);
    await kv.set('settings', { a: 1 });
    const s = await persisted(kv, 'settings', { a: 0, b: 2 });
    expect(get(s)).toEqual({ a: 1, b: 2 });
  });
});
