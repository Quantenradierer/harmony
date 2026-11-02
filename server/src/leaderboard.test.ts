import { describe, expect, it } from 'vitest';
import type { LeaderboardEntry } from '@harmony/shared';
import { createApp } from './app.ts';
import { LeaderboardStore } from './leaderboard-store.ts';

const ADA = '3b241101-e2bb-4255-8caf-4136c566a962';
const BOB = '5c7a1c0e-0a8b-4f55-9d7b-2f6d0f6f1a10';
const run = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

function setup() {
  let t = Date.parse('2026-11-02T12:00:00Z');
  const app = createApp({ leaderboard: new LeaderboardStore(':memory:'), now: () => new Date((t += 1000)) });
  const send = (method: string, path: string, body: unknown, ip = '1.2.3.4') =>
    app.request(path, {
      method,
      headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
      body: JSON.stringify(body),
    });
  const board = async () => (await (await app.request('/api/leaderboard')).json()) as LeaderboardEntry[];
  return { app, send, board };
}

describe('leaderboard API', () => {
  it('lists scores best first with their rank and without uuids', async () => {
    const { send, board } = setup();
    const low = await send('POST', '/api/scores', { uuid: ADA, runId: run(1), name: 'Ada', score: 100 });
    expect(low.status).toBe(201);
    expect(await low.json()).toEqual({ rank: 1 });
    const high = await send('POST', '/api/scores', { uuid: BOB, runId: run(2), name: 'Bob', score: 200 });
    expect(await high.json()).toEqual({ rank: 1 });
    const entries = await board();
    expect(entries.map((e) => [e.name, e.score])).toEqual([
      ['Bob', 200],
      ['Ada', 100],
    ]);
    expect(Object.keys(entries[0]!).sort()).toEqual(['createdAt', 'name', 'score']);
  });

  it('ignores a repeated run so retries do not duplicate', async () => {
    const { send, board } = setup();
    const body = { uuid: ADA, runId: run(1), name: 'Ada', score: 100 };
    await send('POST', '/api/scores', body);
    expect((await send('POST', '/api/scores', body)).status).toBe(201);
    expect(await board()).toHaveLength(1);
  });

  it('renames all entries of a uuid when a new name arrives with a score', async () => {
    const { send, board } = setup();
    await send('POST', '/api/scores', { uuid: ADA, runId: run(1), name: 'Ada', score: 100 });
    await send('POST', '/api/scores', { uuid: BOB, runId: run(2), name: 'Bob', score: 50 });
    await send('POST', '/api/scores', { uuid: ADA, runId: run(3), name: 'Ada L.', score: 150 });
    expect((await board()).map((e) => e.name)).toEqual(['Ada L.', 'Ada L.', 'Bob']);
  });

  it('renames all entries of a uuid through PUT /api/player', async () => {
    const { send, board } = setup();
    await send('POST', '/api/scores', { uuid: ADA, runId: run(1), name: 'Ada', score: 100 });
    await send('POST', '/api/scores', { uuid: ADA, runId: run(2), name: 'Ada', score: 90 });
    await send('POST', '/api/scores', { uuid: BOB, runId: run(3), name: 'Bob', score: 50 });
    expect((await send('PUT', '/api/player', { uuid: ADA, name: 'Countess' })).status).toBe(204);
    expect((await board()).map((e) => e.name)).toEqual(['Countess', 'Countess', 'Bob']);
  });

  it('rejects invalid input', async () => {
    const { send } = setup();
    const ok = { uuid: ADA, runId: run(1), name: 'Ada', score: 100 };
    expect((await send('POST', '/api/scores', { ...ok, score: 286 })).status).toBe(400);
    expect((await send('POST', '/api/scores', { ...ok, uuid: 'x' })).status).toBe(400);
    expect((await send('POST', '/api/scores', { ...ok, name: ' ' })).status).toBe(400);
    expect((await send('PUT', '/api/player', { uuid: ADA, name: '' })).status).toBe(400);
  });

  it('rate-limits writes per client', async () => {
    const { send } = setup();
    let last = 201;
    for (let i = 0; i < 21; i++) {
      last = (await send('POST', '/api/scores', { uuid: ADA, runId: run(i), name: 'Ada', score: 1 })).status;
    }
    expect(last).toBe(429);
    expect((await send('POST', '/api/scores', { uuid: ADA, runId: run(99), name: 'Ada', score: 1 }, '9.9.9.9')).status).toBe(201);
  });
});
