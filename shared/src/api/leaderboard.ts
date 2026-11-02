import { POINTS_FIRST_TRY, STREAK_BONUS_MAX } from '../progress/scoring.ts';
import type { ApiError } from './feedback.ts';

/** A training ends after this many questions and its score goes to the leaderboard. */
export const QUIZ_LENGTH = 20;

/** Best possible score of one training: every answer first try, streak bonus capped. */
export const MAX_SCORE = Array.from({ length: QUIZ_LENGTH }, (_, i) => POINTS_FIRST_TRY + Math.min(i, STREAK_BONUS_MAX)).reduce(
  (a, b) => a + b,
  0,
);

export const SCORES_PATH = '/api/scores';
export const PLAYER_PATH = '/api/player';
export const LEADERBOARD_PATH = '/api/leaderboard';
export const PLAYER_NAME_MAX_LENGTH = 30;
export const LEADERBOARD_SIZE = 25;

/** POST /api/scores body. `uuid` identifies the player, `runId` the training (makes retries harmless). */
export interface ScoreRequest {
  uuid: string;
  runId: string;
  name: string;
  score: number;
}

/** POST /api/scores response (201): place of the score on the board. */
export interface ScoreCreated {
  rank: number;
}

/** PUT /api/player body: renames every entry of that uuid. */
export interface PlayerRequest {
  uuid: string;
  name: string;
}

/** An entry of GET /api/leaderboard (best first). The uuid is never exposed. */
export interface LeaderboardEntry {
  name: string;
  score: number;
  /** ISO 8601 timestamp set by the server. */
  createdAt: string;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID.test(value);
}

/** Trimmed name, or an error code. Control characters are refused. */
export function validateName(value: unknown): { name: string } | ApiError {
  if (typeof value !== 'string') return { error: 'invalid' };
  const name = value.trim();
  if (name.length === 0) return { error: 'empty' };
  if ([...name].length > PLAYER_NAME_MAX_LENGTH) return { error: 'too-long' };
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(name)) return { error: 'invalid' };
  return { name };
}

export function validateScore(body: unknown): ScoreRequest | ApiError {
  if (typeof body !== 'object' || body === null) return { error: 'invalid' };
  const b = body as Record<string, unknown>;
  if (!isUuid(b.uuid) || !isUuid(b.runId)) return { error: 'invalid' };
  if (!Number.isInteger(b.score) || (b.score as number) < 0 || (b.score as number) > MAX_SCORE) {
    return { error: 'invalid' };
  }
  const name = validateName(b.name);
  if ('error' in name) return name;
  return { uuid: b.uuid, runId: b.runId, name: name.name, score: b.score as number };
}

export function validatePlayer(body: unknown): PlayerRequest | ApiError {
  if (typeof body !== 'object' || body === null) return { error: 'invalid' };
  const b = body as Record<string, unknown>;
  if (!isUuid(b.uuid)) return { error: 'invalid' };
  const name = validateName(b.name);
  if ('error' in name) return name;
  return { uuid: b.uuid, name: name.name };
}
