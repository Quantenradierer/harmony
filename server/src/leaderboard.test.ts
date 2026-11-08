import { describe, expect, it } from 'vitest';
import type { LeaderboardEntry } from '@harmony/shared';
import { createApp } from './app.ts';
import { LeaderboardStore } from './leaderboard-store.ts';

const ADA = '3b241101-e2bb-4255-8caf-4136c566a962';
const BOB = '5c7a1c0e-0a8b-4f55-9d7b-2f6d0f6f1a10';
let n = 0;
const run = () => `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`;

function setup() {
  let t = Date.parse('2026-11-02T12:00:00Z');
  const app = createApp({ leaderboard: new LeaderboardStore(':memory:'), now: () => new Date((t += 1000)) });
  const send = (method: string, path: string, body: unknown, ip = '1.2.3.4') =>
    app.request(path, {
      method,
      headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
      body: JSON.stringify(body),
    });
  const score = (uuid: string, name: string, board: string, points: number) =>
    send('POST', '/api/scores', { uuid, runId: run(), board, name, score: points });
  const list = async (board?: string) =>
    (await (await app.request(board ? `/api/leaderboard?board=${board}` : '/api/leaderboard')).json()) as LeaderboardEntry[];
  return { app, send, score, list };
}

describe('leaderboard API', () => {
  it('keeps only the best score per player on a lesson board', async () => {
    const { score, list } = setup();
    await score(ADA, 'Ada', 'notes-1', 100);
    await score(ADA, 'Ada', 'notes-1', 180);
    await score(ADA, 'Ada', 'notes-1', 120);
    await score(BOB, 'Bob', 'notes-1', 150);
    await score(BOB, 'Bob', 'notes-2', 250);
    expect(await list('notes-1')).toEqual([
      { name: 'Ada', score: 180, achievements: [] },
      { name: 'Bob', score: 150, achievements: [] },
    ]);
    expect(await list('notes-2')).toEqual([{ name: 'Bob', score: 250, achievements: [] }]);
  });

  it('answers with the place on the board and overall', async () => {
    const { score } = setup();
    expect(await (await score(ADA, 'Ada', 'notes-1', 100)).json()).toEqual({ rank: 1, total: 100, totalRank: 1 });
    expect(await (await score(BOB, 'Bob', 'notes-1', 50)).json()).toEqual({ rank: 2, total: 50, totalRank: 2 });
    expect(await (await score(BOB, 'Bob', 'notes-2', 200)).json()).toEqual({ rank: 1, total: 250, totalRank: 1 });
    // A worse run does not lower anything.
    expect(await (await score(BOB, 'Bob', 'notes-2', 10)).json()).toEqual({ rank: 1, total: 250, totalRank: 1 });
  });

  it('builds the global board from the best score of every board', async () => {
    const { score, list } = setup();
    await score(ADA, 'Ada', 'notes-1', 100);
    await score(ADA, 'Ada', 'notes-1', 150); // counts once, as 150
    await score(ADA, 'Ada', 'intervals-1', 100);
    await score(BOB, 'Bob', 'notes-1', 285);
    await score(BOB, 'Bob', 'practice-notes', 10);
    expect(await list()).toEqual([
      { name: 'Ada', score: 250, achievements: [] },
      { name: 'Bob', score: 295, achievements: [] },
    ].sort((a, b) => b.score - a.score));
  });

  it('shows earned achievements on every board and never takes any away', async () => {
    const { send, list } = setup();
    const post = (board: string, achievements: string[]) =>
      send('POST', '/api/scores', { uuid: ADA, runId: run(), board, name: 'Ada', score: 10, achievements });
    await post('notes-1', ['first-answer']);
    await post('notes-2', ['first-lesson']);
    await post('notes-2', []);
    expect((await list())[0]!.achievements.sort()).toEqual(['first-answer', 'first-lesson']);
    expect((await list('notes-1'))[0]!.achievements.sort()).toEqual(['first-answer', 'first-lesson']);
  });

  it('never exposes uuids', async () => {
    const { score, list } = setup();
    await score(ADA, 'Ada', 'notes-1', 100);
    expect(Object.keys((await list('notes-1'))[0]!)).toEqual(['name', 'score', 'achievements']);
    expect(Object.keys((await list())[0]!)).toEqual(['name', 'score', 'achievements']);
  });

  it('ignores a repeated run so retries do not duplicate', async () => {
    const { send, list } = setup();
    const body = { uuid: ADA, runId: run(), board: 'notes-1', name: 'Ada', score: 100 };
    await send('POST', '/api/scores', body);
    expect((await send('POST', '/api/scores', body)).status).toBe(201);
    expect(await list()).toEqual([{ name: 'Ada', score: 100, achievements: [] }]);
  });

  it('renames all entries of a uuid, with a score or through PUT /api/player', async () => {
    const { send, score, list } = setup();
    await score(ADA, 'Ada', 'notes-1', 100);
    await score(ADA, 'Ada', 'notes-2', 90);
    await score(BOB, 'Bob', 'notes-1', 50);
    await score(ADA, 'Ada L.', 'notes-3', 10);
    expect((await list('notes-1')).map((e) => e.name)).toEqual(['Ada L.', 'Bob']);
    expect((await list('notes-2')).map((e) => e.name)).toEqual(['Ada L.']);
    expect((await send('PUT', '/api/player', { uuid: ADA, name: 'Countess' })).status).toBe(204);
    expect((await list()).map((e) => e.name)).toEqual(['Countess', 'Bob']);
  });

  it('rejects invalid input', async () => {
    const { send, app } = setup();
    const ok = { uuid: ADA, runId: run(), board: 'notes-1', name: 'Ada', score: 100 };
    expect((await send('POST', '/api/scores', { ...ok, score: 286 })).status).toBe(400);
    expect((await send('POST', '/api/scores', { ...ok, board: 'nope' })).status).toBe(400);
    expect((await send('POST', '/api/scores', { ...ok, uuid: 'x' })).status).toBe(400);
    expect((await send('POST', '/api/scores', { ...ok, name: ' ' })).status).toBe(400);
    expect((await send('PUT', '/api/player', { uuid: ADA, name: '' })).status).toBe(400);
    expect((await app.request('/api/leaderboard?board=nope')).status).toBe(400);
  });

  it('keeps entries from before boards existed out of every board', async () => {
    const path = `${process.env.TMPDIR ?? '/tmp'}/legacy-${Date.now()}.db`;
    const { DatabaseSync } = await import('node:sqlite');
    const old = new DatabaseSync(path);
    old.exec(`CREATE TABLE scores (id INTEGER PRIMARY KEY AUTOINCREMENT, run_id TEXT NOT NULL UNIQUE, uuid TEXT NOT NULL,
      name TEXT NOT NULL, score INTEGER NOT NULL, created_at TEXT NOT NULL);
      INSERT INTO scores (run_id, uuid, name, score, created_at) VALUES ('r', '${ADA}', 'Ada', 99, 'x')`);
    old.close();
    const store = new LeaderboardStore(path);
    expect(store.listTotal(10)).toEqual([]);
    store.close();
  });

  it('rate-limits writes per client', async () => {
    const { score, send } = setup();
    let last = 201;
    for (let i = 0; i < 21; i++) last = (await score(ADA, 'Ada', 'notes-1', 1)).status;
    expect(last).toBe(429);
    expect((await send('POST', '/api/scores', { uuid: ADA, runId: run(), board: 'notes-1', name: 'Ada', score: 1 }, '9.9.9.9')).status).toBe(201);
  });
});
