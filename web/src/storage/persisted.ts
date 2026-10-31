import type { Writable } from 'svelte/store';
import type { KeyValueStore } from './kv.ts';

/**
 * Loads `key` from the KeyValueStore into `store`, then saves every change.
 * Stored values are merged over `initial`, so fields added later get defaults.
 */
export async function bindPersisted<T extends object>(
  kv: KeyValueStore,
  key: string,
  store: Writable<T>,
  initial: T,
): Promise<void> {
  const stored = await kv.get<Partial<T>>(key);
  store.set({ ...initial, ...stored });
  let first = true;
  store.subscribe((value) => {
    if (first) {
      first = false;
      return;
    }
    // Plain JSON copy: IndexedDB cannot store proxies.
    void kv.set(key, JSON.parse(JSON.stringify(value)));
  });
}
