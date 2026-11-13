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
  /** How often a played category was mistaken for another: played → picked → count. */
  confusions?: Record<string, Record<string, number>>;
  /** Answers and first-try answers per category and local calendar day: category → day → stats. */
  categoryDays?: Record<string, Record<string, CategoryStats>>;
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
  /** Categories the learner wrongly took the sound for (see `mistakenFor`). */
  mistakenFor?: string[];
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
  let categoryDays = progress.categoryDays;
  if (answer.day) {
    const row = categoryDays?.[answer.category] ?? {};
    const d = row[answer.day] ?? { attempts: 0, correct: 0 };
    categoryDays = {
      ...categoryDays,
      [answer.category]: { ...row, [answer.day]: { attempts: d.attempts + 1, correct: d.correct + (firstTry ? 1 : 0) } },
    };
  }
  let confusions = progress.confusions;
  for (const picked of answer.mistakenFor ?? []) {
    const row = confusions?.[answer.category] ?? {};
    confusions = { ...confusions, [answer.category]: { ...row, [picked]: (row[picked] ?? 0) + 1 } };
  }
  return {
    ...progress,
    ...(days ? { days } : {}),
    ...(confusions ? { confusions } : {}),
    ...(categoryDays ? { categoryDays } : {}),
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

/** One active day of a category: that day's answers and first-try answers. */
export interface TrendPoint extends CategoryStats {
  day: string;
}

/** Days on which `category` was practised, oldest first, keeping at most the last `limit`. */
export function categoryTrend(progress: Progress, category: string, limit = 30): TrendPoint[] {
  return Object.entries(progress.categoryDays?.[category] ?? {})
    .filter(([, s]) => s.attempts > 0)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .slice(-limit)
    .map(([day, s]) => ({ day, ...s }));
}
