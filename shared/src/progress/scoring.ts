import type { Outcome } from '../quiz/round.ts';

export const POINTS_FIRST_TRY = 10;
export const POINTS_SECOND_TRY = 5;
/** Extra points per consecutive first-try answer, capped. */
export const STREAK_BONUS_MAX = 5;

/**
 * Points for one answer, given the streak of first-try answers before it.
 * Replays are free, so they are not an input.
 */
export function scoreAnswer(streak: number, outcome: Outcome): { points: number; streak: number } {
  switch (outcome) {
    case 'first-try':
      return { points: POINTS_FIRST_TRY + Math.min(streak, STREAK_BONUS_MAX), streak: streak + 1 };
    case 'second-try':
      return { points: POINTS_SECOND_TRY, streak: 0 };
    case 'wrong':
      return { points: 0, streak: 0 };
  }
}
