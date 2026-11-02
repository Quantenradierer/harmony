import { accuracy, type CategoryStats } from './progress.ts';

export type Medal = 'bronze' | 'silver' | 'gold';

/** Answers needed in a category before it can earn a medal. */
export const MEDAL_MIN_ATTEMPTS = 10;

const MEDAL_THRESHOLDS: [Medal, number][] = [
  ['gold', 0.9],
  ['silver', 0.75],
  ['bronze', 0.6],
];

/** Medal for a category by first-try accuracy, or undefined if too few answers or too low. */
export function medalFor(stats: CategoryStats | undefined): Medal | undefined {
  if (!stats || stats.attempts < MEDAL_MIN_ATTEMPTS) return undefined;
  const a = accuracy(stats) ?? 0;
  return MEDAL_THRESHOLDS.find(([, min]) => a >= min)?.[0];
}

/** Total-points milestones, ascending, with the medal each one earns. */
export const POINT_MILESTONES: { points: number; medal: Medal }[] = [
  { points: 100, medal: 'bronze' },
  { points: 500, medal: 'silver' },
  { points: 2000, medal: 'gold' },
];

/** Best medal earned by total points. */
export function pointsMedal(totalPoints: number): Medal | undefined {
  return [...POINT_MILESTONES].reverse().find((m) => totalPoints >= m.points)?.medal;
}
