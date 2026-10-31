import type { Writable } from 'svelte/store';
import { emptyProgress, type Progress } from '@harmony/shared';
import { openIdbStore, type KeyValueStore } from './storage/kv.ts';
import { persisted } from './storage/persisted.ts';

export interface AppState {
  kv: KeyValueStore;
  progress: Writable<Progress>;
}

export async function initAppState(kv: KeyValueStore = openIdbStore()): Promise<AppState> {
  return {
    kv,
    progress: await persisted(kv, 'progress', emptyProgress()),
  };
}
