import type { Medal } from './medals.ts';
import type { Progress } from './progress.ts';
import type { ModuleId } from '../quiz/types.ts';
import { LESSONS, type QuizSpec } from '../lessons/lessons.ts';
import { isUnlocked } from '../lessons/gating.ts';
import { practiceCategories, practiceSpec } from '../lessons/practice.ts';
import { specCategories } from '../quiz/generate.ts';

/** Answers, first-try answers and points of one calendar day. */
export interface DayStats {
  answers: number;
  correct: number;
  points: number;
}

/** Local calendar day as YYYY-MM-DD. */
export function dayKey(now: Date): string {
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${m}-${d}`;
}

/** The day `offset` days after `day` (negative goes back). Calendar maths only, no time zones. */
export function shiftDay(day: string, offset: number): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

/** The last `count` days up to and including `today`, oldest first, with zeros for idle days. */
export function recentDays(progress: Progress, today: string, count: number): ({ day: string } & DayStats)[] {
  return Array.from({ length: count }, (_, i) => {
    const day = shiftDay(today, i - count + 1);
    return { day, ...(progress.days?.[day] ?? { answers: 0, correct: 0, points: 0 }) };
  });
}

const MODULES = Object.keys(LESSONS) as ModuleId[];

/**
 * Categories the learner has met, per module: those asked by lessons they
 * have reached (by real progress, ignoring the gating switch) and those
 * they have answered before.
 */
export function learnedCategories(progress: Progress): Record<ModuleId, string[]> {
  const result = {} as Record<ModuleId, string[]>;
  for (const module of MODULES) {
    const path = LESSONS[module];
    const met = new Set<string>();
    for (const lesson of path) {
      if (isUnlocked(progress, path, lesson.id, true)) specCategories(lesson.spec).forEach((c) => met.add(c));
    }
    for (const [id, stats] of Object.entries(progress.categories)) {
      if (stats.attempts > 0) met.add(id);
    }
    result[module] = practiceCategories(module).filter((c) => met.has(c));
  }
  return result;
}

/** Quiz specs of the daily challenge: one per module with at least two learned categories. */
export function dailySpecs(progress: Progress): QuizSpec[] {
  const learned = learnedCategories(progress);
  const specs = MODULES.filter((m) => learned[m].length >= 2).map((m) => practiceSpec(m, learned[m]));
  return specs.length > 0 ? specs : [LESSONS.notes[0]!.spec];
}

/** Marks the daily challenge of `day` as done. */
export function completeDaily(progress: Progress, day: string): Progress {
  const done = progress.dailyDone ?? [];
  return done.includes(day) ? progress : { ...progress, dailyDone: [...done, day].sort() };
}

/** Consecutive days with a finished challenge, ending today (or yesterday, if today is still open). */
export function currentStreak(done: string[], today: string): number {
  const set = new Set(done);
  let day = set.has(today) ? today : shiftDay(today, -1);
  let n = 0;
  while (set.has(day)) {
    n++;
    day = shiftDay(day, -1);
  }
  return n;
}

/** Longest run of consecutive days with a finished challenge. */
export function longestStreak(done: string[]): number {
  const set = new Set(done);
  let best = 0;
  for (const day of set) {
    if (set.has(shiftDay(day, -1))) continue;
    let n = 1;
    while (set.has(shiftDay(day, n))) n++;
    best = Math.max(best, n);
  }
  return best;
}

/** Awards for daily challenges finished on consecutive days, ascending. */
export const DAILY_AWARDS: { days: number; medal: Medal }[] = [
  { days: 3, medal: 'bronze' },
  { days: 7, medal: 'silver' },
  { days: 30, medal: 'gold' },
];

/** Best daily-streak award earned so far. */
export function dailyMedal(done: string[]): Medal | undefined {
  const best = longestStreak(done);
  return [...DAILY_AWARDS].reverse().find((a) => best >= a.days)?.medal;
}
