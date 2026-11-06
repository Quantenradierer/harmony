import type { Outcome } from '../quiz/round.ts';
import type { DayStats } from './daily.ts';

export interface CategoryStats {
  attempts: number;
  /** Answers correct on the first try. */
  correct: number;
}

/** Everything the app remembers about the learner. Plain JSON. */
export interface Progress {
  totalPoints: number;
  categories: Record<string, CategoryStats>;
  /** Recent first-try results per lesson id, oldest first. */
  lessonHistory: Record<string, boolean[]>;
  /** Ids of lessons whose gate was reached; the next lesson is unlocked. */
  passed: string[];
  /** Highest points reached within one practice session (highscore). */
  bestSession?: number;
  /** Answers and points per local calendar day (YYYY-MM-DD). */
  days?: Record<string, DayStats>;
  /** Days (YYYY-MM-DD) whose daily challenge was finished, ascending. */
  dailyDone?: string[];
}

export function emptyProgress(): Progress {
  return { totalPoints: 0, categories: {}, lessonHistory: {}, passed: [] };
}

export interface AnswerRecord {
  category: string;
  outcome: Outcome;
  points: number;
  /** Points of the running session after this answer. */
  sessionPoints?: number;
  /** Local calendar day of the answer (YYYY-MM-DD); counted in `days` when set. */
  day?: string;
}

export function recordAnswer(progress: Progress, answer: AnswerRecord): Progress {
  const prev = progress.categories[answer.category] ?? { attempts: 0, correct: 0 };
  const firstTry = answer.outcome === 'first-try';
  let days = progress.days;
  if (answer.day) {
    const d = days?.[answer.day] ?? { answers: 0, correct: 0, points: 0 };
    days = {
      ...days,
      [answer.day]: { answers: d.answers + 1, correct: d.correct + (firstTry ? 1 : 0), points: d.points + answer.points },
    };
  }
  return {
    ...progress,
    ...(days ? { days } : {}),
    totalPoints: progress.totalPoints + answer.points,
    bestSession: Math.max(progress.bestSession ?? 0, answer.sessionPoints ?? 0),
    categories: {
      ...progress.categories,
      [answer.category]: {
        attempts: prev.attempts + 1,
        correct: prev.correct + (firstTry ? 1 : 0),
      },
    },
  };
}

/** Share of first-try answers in [0, 1], or undefined if never asked. */
export function accuracy(stats: CategoryStats | undefined): number | undefined {
  if (!stats || stats.attempts === 0) return undefined;
  return stats.correct / stats.attempts;
}
