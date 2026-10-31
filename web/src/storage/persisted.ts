import { writable, type Writable } from 'svelte/store';
import type { KeyValueStore } from './kv.ts';

/**
 * A Svelte store loaded from and saved to a KeyValueStore. Stored values are
 * merged over `initial`, so fields added later get their defaults.
 */
export async function persisted<T extends object>(
  kv: KeyValueStore,
  key: string,
  initial: T,
): Promise<Writable<T>> {
  const stored = await kv.get<Partial<T>>(key);
  const store = writable<T>({ ...initial, ...stored });
  let first = true;
  store.subscribe((value) => {
    if (first) {
      first = false;
      return;
    }
    // $state proxies and Svelte values must be plain for IndexedDB.
    void kv.set(key, JSON.parse(JSON.stringify(value)));
  });
  return store;
}
