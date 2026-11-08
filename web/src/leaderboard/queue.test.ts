import { describe, expect, it } from 'vitest';
import type { ScoreRequest } from '@harmony/shared';
import { MemoryStore } from '../storage/kv.ts';
import { ScoreQueue } from './queue.ts';
import type { ScoreResult } from './client.ts';

const score = (n: number): ScoreRequest => ({
  uuid: '3b241101-e2bb-4255-8caf-4136c566a962',
  board: 'notes-1',
  runId: `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`,
  name: 'Ada',
  score: n,
  achievements: [],
});

describe('score queue', () => {
  it('sends right away when online', async () => {
    const sent: number[] = [];
    const q = new ScoreQueue(new MemoryStore(), async (s) => (sent.push(s.score), { status: 'sent', rank: 2, total: 5, totalRank: 1 }));
    expect(await q.submit(score(5))).toEqual({ status: 'sent', rank: 2, total: 5, totalRank: 1 });
    expect(sent).toEqual([5]);
  });

  it('keeps scores while offline and delivers them in order on flush', async () => {
    const sent: number[] = [];
    let online = false;
    const q = new ScoreQueue(new MemoryStore(), async (s): Promise<ScoreResult> => {
      if (!online) return { status: 'network' };
      sent.push(s.score);
      return { status: 'sent', rank: 1, total: 1, totalRank: 1 };
    });
    expect(await q.submit(score(1))).toEqual({ status: 'queued' });
    expect(await q.submit(score(2))).toEqual({ status: 'queued' });
    online = true;
    await q.flush();
    expect(sent).toEqual([1, 2]);
  });

  it('drops scores the server rejects', async () => {
    let calls = 0;
    const q = new ScoreQueue(new MemoryStore(), async () => (calls++, { status: 'rejected' }));
    expect(await q.submit(score(1))).toEqual({ status: 'rejected' });
    await q.flush();
    expect(calls).toBe(1);
  });
});
