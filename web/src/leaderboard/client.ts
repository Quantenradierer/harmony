import {
  BOARD_PARAM,
  LEADERBOARD_PATH,
  PLAYER_PATH,
  SCORES_PATH,
  type LeaderboardEntry,
  type PlayerRequest,
  type ScoreCreated,
  type ScoreRequest,
} from '@harmony/shared';

export type ScoreResult =
  | ({ status: 'sent' } & ScoreCreated)
  | { status: 'rejected' | 'rate-limited' | 'network' };

const JSON_HEADERS = { 'content-type': 'application/json' };

/** Posts one score; never throws. */
export async function postScore(score: ScoreRequest, fetchFn: typeof fetch = fetch): Promise<ScoreResult> {
  try {
    const res = await fetchFn(SCORES_PATH, { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(score) });
    if (res.ok) return { status: 'sent', ...((await res.json()) as ScoreCreated) };
    if (res.status === 429) return { status: 'rate-limited' };
    if (res.status >= 500) return { status: 'network' };
    return { status: 'rejected' };
  } catch {
    return { status: 'network' };
  }
}

/** Renames all entries of the player on the board; best effort, never throws. */
export async function putPlayerName(player: PlayerRequest, fetchFn: typeof fetch = fetch): Promise<boolean> {
  try {
    const res = await fetchFn(PLAYER_PATH, { method: 'PUT', headers: JSON_HEADERS, body: JSON.stringify(player) });
    return res.ok;
  } catch {
    return false;
  }
}

/** A board (a lesson id or `practice-<module>`), or the global one; undefined if it cannot be loaded. */
export async function fetchLeaderboard(
  board?: string,
  fetchFn: typeof fetch = fetch,
): Promise<LeaderboardEntry[] | undefined> {
  try {
    const res = await fetchFn(board ? `${LEADERBOARD_PATH}?${BOARD_PARAM}=${encodeURIComponent(board)}` : LEADERBOARD_PATH);
    return res.ok ? ((await res.json()) as LeaderboardEntry[]) : undefined;
  } catch {
    return undefined;
  }
}
