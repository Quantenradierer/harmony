import { POINTS_FIRST_TRY, STREAK_BONUS_MAX } from '../progress/scoring.ts';
import { ACHIEVEMENTS } from '../progress/achievements.ts';
import { LESSONS, findLesson } from '../lessons/lessons.ts';
import type { ModuleId } from '../quiz/types.ts';
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
/** Query parameter selecting a board; omit it for the global board. */
export const BOARD_PARAM = 'board';
export const PLAYER_NAME_MAX_LENGTH = 30;
export const LEADERBOARD_SIZE = 25;

const MODULE_IDS = Object.keys(LESSONS) as ModuleId[];

/** Board of a lesson (its id) or of free practice of a module. */
export function practiceBoard(module: ModuleId): string {
  return `practice-${module}`;
}

export function isBoard(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    (findLesson(value) !== undefined || MODULE_IDS.some((m) => practiceBoard(m) === value))
  );
}

/** POST /api/scores body. `uuid` identifies the player, `runId` the training (makes retries harmless). */
export interface ScoreRequest {
  uuid: string;
  /** Board the score belongs to: a lesson id or `practice-<module>`. */
  board: string;
  runId: string;
  name: string;
  score: number;
  /** Ids of the achievements the player has earned (shown next to their name). */
  achievements: string[];
}

/** POST /api/scores response (201): the player's place on that board and overall. */
export interface ScoreCreated {
  /** Place on the board by the player's best score there. */
  rank: number;
  /** The player's overall score: the sum of their best scores on all boards. */
  total: number;
  /** Place on the global board. */
  totalRank: number;
}

/** PUT /api/player body: renames every entry of that uuid. */
export interface PlayerRequest {
  uuid: string;
  name: string;
}

/**
 * An entry of GET /api/leaderboard (best first), one per player. Without a
 * `board` query the score is the sum of the player's best scores. The uuid is
 * never exposed.
 */
export interface LeaderboardEntry {
  name: string;
  score: number;
  /** Ids of the player's earned achievements. */
  achievements: string[];
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
  if (!isUuid(b.uuid) || !isUuid(b.runId) || !isBoard(b.board)) return { error: 'invalid' };
  if (!Number.isInteger(b.score) || (b.score as number) < 0 || (b.score as number) > MAX_SCORE) {
    return { error: 'invalid' };
  }
  const name = validateName(b.name);
  if ('error' in name) return name;
  // Optional (older clients omit it); unknown ids are dropped, duplicates collapse.
  const known = new Set(ACHIEVEMENTS.map((a) => a.id));
  const given = Array.isArray(b.achievements) ? (b.achievements as unknown[]) : [];
  const achievements = [...new Set(given.filter((id): id is string => typeof id === 'string' && known.has(id)))];
  return { uuid: b.uuid, runId: b.runId, board: b.board, name: name.name, score: b.score as number, achievements };
}

export function validatePlayer(body: unknown): PlayerRequest | ApiError {
  if (typeof body !== 'object' || body === null) return { error: 'invalid' };
  const b = body as Record<string, unknown>;
  if (!isUuid(b.uuid)) return { error: 'invalid' };
  const name = validateName(b.name);
  if ('error' in name) return name;
  return { uuid: b.uuid, name: name.name };
}
