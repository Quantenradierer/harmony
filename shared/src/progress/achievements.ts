import type { Progress } from './progress.ts';
import type { ModuleId } from '../quiz/types.ts';
import { LESSONS } from '../lessons/lessons.ts';
import { practiceCategories } from '../lessons/practice.ts';
import { medalFor } from './medals.ts';

/**
 * One achievement. Everything is derived from Progress, so achievements need
 * no storage of their own and backups carry them for free.
 */
export interface Achievement {
  id: string;
  icon: string;
  /** Value at which the achievement is earned. */
  target: number;
  /** Current value; the achievement is earned once it reaches `target`. */
  value: (p: Progress) => number;
}

const MODULES = Object.keys(LESSONS) as ModuleId[];

function totalAnswers(p: Progress): number {
  return Object.values(p.categories).reduce((n, s) => n + s.attempts, 0);
}

function lessonsPassed(p: Progress, module: ModuleId): number {
  return LESSONS[module].filter((l) => p.passed.includes(l.id)).length;
}

function modulesTried(p: Progress): number {
  return MODULES.filter((m) => practiceCategories(m).some((c) => (p.categories[c]?.attempts ?? 0) > 0)).length;
}

function goldMedals(p: Progress): number {
  return Object.values(p.categories).filter((s) => medalFor(s) === 'gold').length;
}

function days(p: Progress) {
  return Object.values(p.days ?? {});
}

/** Answers needed in one day, all right on the first try, for a perfect day. */
export const PERFECT_DAY_MIN = 20;

function moduleMaster(module: ModuleId, icon: string): Achievement {
  return {
    id: `master-${module}`,
    icon,
    target: LESSONS[module].length,
    value: (p) => lessonsPassed(p, module),
  };
}

/** All achievements, in display order. */
export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-answer', icon: '🎵', target: 1, value: totalAnswers },
  { id: 'answers-100', icon: '💯', target: 100, value: totalAnswers },
  { id: 'answers-1000', icon: '🎼', target: 1000, value: totalAnswers },
  { id: 'all-modules', icon: '🧭', target: MODULES.length, value: modulesTried },
  { id: 'first-lesson', icon: '🎓', target: 1, value: (p) => p.passed.length },
  moduleMaster('notes', '🎹'),
  moduleMaster('intervals', '📐'),
  moduleMaster('chords', '🎶'),
  { id: 'first-gold', icon: '👂', target: 1, value: goldMedals },
  { id: 'gold-10', icon: '🏆', target: 10, value: goldMedals },
  { id: 'session-200', icon: '🔥', target: 200, value: (p) => p.bestSession ?? 0 },
  {
    id: 'perfect-day',
    icon: '✨',
    target: 1,
    value: (p) => days(p).filter((d) => d.answers >= PERFECT_DAY_MIN && d.correct === d.answers).length,
  },
  { id: 'marathon', icon: '🏃', target: 200, value: (p) => Math.max(0, ...days(p).map((d) => d.answers)) },
  { id: 'active-7', icon: '📅', target: 7, value: (p) => days(p).filter((d) => d.answers > 0).length },
  { id: 'first-daily', icon: '☀️', target: 1, value: (p) => p.dailyDone?.length ?? 0 },
];

export function isEarned(a: Achievement, p: Progress): boolean {
  return a.value(p) >= a.target;
}

/** Ids of all earned achievements. */
export function earnedAchievements(p: Progress): string[] {
  return ACHIEVEMENTS.filter((a) => isEarned(a, p)).map((a) => a.id);
}

/** Achievements earned in `after` but not in `before`, in display order. */
export function newAchievements(before: Progress, after: Progress): Achievement[] {
  return ACHIEVEMENTS.filter((a) => isEarned(a, after) && !isEarned(a, before));
}
