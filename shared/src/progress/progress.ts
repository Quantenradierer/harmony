import type { Outcome } from '../quiz/round.ts';

export interface CategoryStats {
  attempts: number;
  /** Answers correct on the first try. */
  correct: number;
}

/** Everything the app remembers about the learner. Plain JSON. */
export interface Progress {
  totalPoints: number;
  categories: Record<string, CategoryStats>;
}

export function emptyProgress(): Progress {
  return { totalPoints: 0, categories: {} };
}

export interface AnswerRecord {
  category: string;
  outcome: Outcome;
  points: number;
}

export function recordAnswer(progress: Progress, answer: AnswerRecord): Progress {
  const prev = progress.categories[answer.category] ?? { attempts: 0, correct: 0 };
  return {
    ...progress,
    totalPoints: progress.totalPoints + answer.points,
    categories: {
      ...progress.categories,
      [answer.category]: {
        attempts: prev.attempts + 1,
        correct: prev.correct + (answer.outcome === 'first-try' ? 1 : 0),
      },
    },
  };
}

/** Share of first-try answers in [0, 1], or undefined if never asked. */
export function accuracy(stats: CategoryStats | undefined): number | undefined {
  if (!stats || stats.attempts === 0) return undefined;
  return stats.correct / stats.attempts;
}
