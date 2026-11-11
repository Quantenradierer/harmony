import type { CategoryStats, Progress } from './progress.ts';
import type { ModuleId, Rng } from '../quiz/types.ts';
import type { QuizSpec } from '../lessons/lessons.ts';
import { practiceCategories, practiceSpec } from '../lessons/practice.ts';
import { learnedCategories } from './daily.ts';

/**
 * How weak a category is, in (0, 1): the share of answers not right on the
 * first try, smoothed towards 50% so a few answers do not swing it far.
 * Never asked counts as 50%.
 */
export function weakness(stats: CategoryStats | undefined): number {
  const attempts = stats?.attempts ?? 0;
  const correct = stats?.correct ?? 0;
  return (attempts - correct + 1) / (attempts + 2);
}

/** One mix-up: `played` was taken for `heardAs` in `count` of its `attempts` answers. */
export interface Confusion {
  played: string;
  heardAs: string;
  count: number;
  attempts: number;
  /** count / attempts. */
  rate: number;
}

/** Mix-ups seen at least `minCount` times, most frequent (by rate, then count) first. */
export function topConfusions(progress: Progress, limit = 5, minCount = 2): Confusion[] {
  const list: Confusion[] = [];
  for (const [played, row] of Object.entries(progress.confusions ?? {})) {
    const attempts = progress.categories[played]?.attempts ?? 0;
    for (const [heardAs, count] of Object.entries(row)) {
      if (count < minCount || attempts === 0) continue;
      list.push({ played, heardAs, count, attempts, rate: Math.min(1, count / attempts) });
    }
  }
  return list.sort((a, b) => b.rate - a.rate || b.count - a.count).slice(0, limit);
}

/** The weakest categories among those the learner has answered, weakest first. */
export function weakestCategories(progress: Progress, limit = 5): { category: string; stats: CategoryStats }[] {
  return Object.entries(progress.categories)
    .filter(([, s]) => s.attempts > 0)
    .map(([category, stats]) => ({ category, stats }))
    .sort((a, b) => weakness(b.stats) - weakness(a.stats))
    .slice(0, limit);
}

/** Weak categories a focus training targets per module, before mix-up partners join. */
export const FOCUS_SIZE = 4;

/** One module of a focus training: its answer choices. */
export interface FocusPart {
  module: ModuleId;
  /** Answer choices in display order. */
  categories: string[];
  spec: QuizSpec;
}

/**
 * A focus training on the learner's weak spots: per module with at least two
 * learned categories, the weakest few plus whatever they get mixed up with,
 * so the confusing pairs appear side by side.
 */
export function focusPlan(progress: Progress): FocusPart[] {
  const learned = learnedCategories(progress);
  const parts: FocusPart[] = [];
  for (const [module, all] of Object.entries(learned) as [ModuleId, string[]][]) {
    if (all.length < 2) continue;
    const ranked = [...all].sort((a, b) => weakness(progress.categories[b]) - weakness(progress.categories[a]));
    const offered = practiceCategories(module);
    const chosen = new Set(ranked.slice(0, FOCUS_SIZE));
    for (const c of [...chosen]) {
      // A partner may be one never played yet: picking it shows the learner knows it as an answer.
      const partner = Object.entries(progress.confusions?.[c] ?? {})
        .filter(([other]) => offered.includes(other))
        .sort((a, b) => b[1] - a[1])[0];
      if (partner) chosen.add(partner[0]);
    }
    const categories = offered.filter((c) => chosen.has(c));
    parts.push({ module, categories, spec: practiceSpec(module, categories) });
  }
  return parts;
}

/** Floor on a category's weight so strong categories still come up now and then. */
const MIN_WEIGHT = 0.05;

/**
 * Picks the next focus question: a category drawn with probability in
 * proportion to its current weakness, so it adapts as the training goes on.
 */
export function pickFocus(plan: FocusPart[], progress: Progress, rng: Rng): { spec: QuizSpec; category: string } {
  const options = plan.flatMap((part) =>
    part.categories.map((category) => ({
      spec: part.spec,
      category,
      weight: Math.max(MIN_WEIGHT, weakness(progress.categories[category])),
    })),
  );
  if (options.length === 0) throw new Error('empty focus plan');
  let r = rng() * options.reduce((sum, o) => sum + o.weight, 0);
  for (const o of options) {
    r -= o.weight;
    if (r < 0) return { spec: o.spec, category: o.category };
  }
  const last = options[options.length - 1]!;
  return { spec: last.spec, category: last.category };
}
