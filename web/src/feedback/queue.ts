import { writable, type Readable } from 'svelte/store';
import type { KeyValueStore } from '../storage/kv.ts';
import { postFeedback, type SendResult } from './client.ts';

const KEY = 'feedbackQueue';

export type SubmitResult = Exclude<SendResult, 'network'> | 'queued';

/**
 * Feedback that could not be sent (offline, server down) is kept in
 * IndexedDB and sent by flush(), e.g. when the connection returns.
 */
export class FeedbackQueue {
  private pendingStore = writable(0);
  readonly pending: Readable<number> = this.pendingStore;
  private flushing?: Promise<void>;

  constructor(
    private kv: KeyValueStore,
    private send: (text: string) => Promise<SendResult> = postFeedback,
  ) {}

  private async load(): Promise<string[]> {
    return (await this.kv.get<string[]>(KEY)) ?? [];
  }

  private async save(queue: string[]) {
    await this.kv.set(KEY, queue);
    this.pendingStore.set(queue.length);
  }

  async submit(text: string): Promise<SubmitResult> {
    await this.flush();
    if ((await this.load()).length === 0) {
      const result = await this.send(text);
      if (result !== 'network') return result;
    }
    await this.save([...(await this.load()), text]);
    return 'queued';
  }

  /** Sends queued feedback in order; stops at the first network failure. */
  flush(): Promise<void> {
    this.flushing ??= this.doFlush().finally(() => (this.flushing = undefined));
    return this.flushing;
  }

  private async doFlush() {
    let queue = await this.load();
    this.pendingStore.set(queue.length);
    while (queue.length > 0) {
      const result = await this.send(queue[0]!);
      if (result === 'network' || result === 'rate-limited') break;
      // 'sent', or 'rejected' (would never succeed): drop it.
      queue = queue.slice(1);
      await this.save(queue);
    }
  }
}
