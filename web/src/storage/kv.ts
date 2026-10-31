import { openDB } from 'idb';

/** Minimal async key-value storage; IndexedDB in the app, memory in tests. */
export interface KeyValueStore {
  get<T>(key: string): Promise<T | undefined>;
  set(key: string, value: unknown): Promise<void>;
}

const STORE = 'kv';

export function openIdbStore(dbName = 'harmony-trainer'): KeyValueStore {
  const db = openDB(dbName, 1, {
    upgrade(db) {
      db.createObjectStore(STORE);
    },
  });
  return {
    async get<T>(key: string) {
      return (await (await db).get(STORE, key)) as T | undefined;
    },
    async set(key, value) {
      await (await db).put(STORE, value, key);
    },
  };
}

export class MemoryStore implements KeyValueStore {
  data = new Map<string, unknown>();
  async get<T>(key: string) {
    return structuredClone(this.data.get(key)) as T | undefined;
  }
  async set(key: string, value: unknown) {
    this.data.set(key, structuredClone(value));
  }
}
