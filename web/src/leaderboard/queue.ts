import type { ScoreRequest } from '@harmony/shared';
import type { KeyValueStore } from '../storage/kv.ts';
import { postScore, type ScoreResult } from './client.ts';

const KEY = 'scoreQueue';

export type SubmitResult = { status: 'sent'; rank: number } | { status: 'queued' | 'rejected' };

/** Scores that could not be sent (offline, server down) are kept and sent by flush(). */
export class ScoreQueue {
  private flushing?: Promise<void>;

  constructor(
    private kv: KeyValueStore,
    private send: (score: ScoreRequest) => Promise<ScoreResult> = postScore,
  ) {}

  private async load(): Promise<ScoreRequest[]> {
    return (await this.kv.get<ScoreRequest[]>(KEY)) ?? [];
  }

  async submit(score: ScoreRequest): Promise<SubmitResult> {
    await this.flush();
    if ((await this.load()).length === 0) {
      const result = await this.send(score);
      if (result.status === 'sent') return result;
      if (result.status === 'rejected') return { status: 'rejected' };
    }
    await this.kv.set(KEY, [...(await this.load()), score]);
    return { status: 'queued' };
  }

  /** Sends queued scores in order; stops at the first network failure. */
  flush(): Promise<void> {
    this.flushing ??= this.doFlush().finally(() => (this.flushing = undefined));
    return this.flushing;
  }

  private async doFlush() {
    let queue = await this.load();
    while (queue.length > 0) {
      const result = await this.send(queue[0]!);
      if (result.status === 'network' || result.status === 'rate-limited') break;
      // 'sent', or 'rejected' (would never succeed): drop it.
      queue = queue.slice(1);
      await this.kv.set(KEY, queue);
    }
  }
}
