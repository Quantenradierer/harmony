import { get, writable } from 'svelte/store';
import { earnedAchievements, type ScoreCreated } from '@harmony/shared';
import { progress, scoreQueue, settings } from '../stores.ts';
import { putPlayerName } from './client.ts';

export type RunResult =
  | { status: 'sending' | 'queued' | 'failed' | 'no-name' }
  | ({ status: 'sent' } & ScoreCreated);

/** What happened to the score of the training that just ended. */
export const runResult = writable<RunResult | undefined>();

/** The player's id, created on first use. */
function playerId(): string {
  const existing = get(settings).playerId;
  if (existing) return existing;
  const id = crypto.randomUUID();
  settings.update((s) => ({ ...s, playerId: id }));
  return id;
}

/** Sends the final score of a training on a board (lesson id or `practice-<module>`). */
export async function submitRun({ points }: { points: number }, board: string): Promise<void> {
  const name = get(settings).playerName.trim();
  if (!name) {
    runResult.set({ status: 'no-name' });
    return;
  }
  runResult.set({ status: 'sending' });
  const result = await scoreQueue.submit({ uuid: playerId(), board, runId: crypto.randomUUID(), name, score: points, achievements: earnedAchievements(get(progress)) });
  runResult.set(
    result.status === 'sent'
      ? result
      : result.status === 'queued'
        ? { status: 'queued' }
        : { status: 'failed' },
  );
}

/** Tells the server about a changed name so older entries follow it. Needs an id from a past run. */
export async function renamePlayer(): Promise<void> {
  const { playerId: uuid, playerName } = get(settings);
  const name = playerName.trim();
  if (uuid && name) await putPlayerName({ uuid, name });
}
