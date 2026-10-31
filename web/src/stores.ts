import { writable } from 'svelte/store';
import { emptyProgress, type Progress } from '@harmony/shared';
import { openIdbStore, type KeyValueStore } from './storage/kv.ts';
import { bindPersisted } from './storage/persisted.ts';
import { defaultSettings, type Settings } from './settings.ts';

/** App-wide state. Persisted once initStores() has run. */
export const progress = writable<Progress>(emptyProgress());
export const settings = writable<Settings>(defaultSettings());

export async function initStores(kv: KeyValueStore = openIdbStore()): Promise<void> {
  await bindPersisted(kv, 'progress', progress, emptyProgress());
  await bindPersisted(kv, 'settings', settings, defaultSettings());
}
