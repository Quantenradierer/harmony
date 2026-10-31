import type { Language, Lesson } from '@harmony/shared';
import { specCategories } from '@harmony/shared';
import { categoryLabel, translate } from './i18n/index.ts';

/** One-line description of what a lesson asks. */
export function lessonSummary(lesson: Lesson, lang: Language): string {
  const categories = specCategories(lesson.spec);
  const spec = lesson.spec;
  if (spec.module === 'intervals') {
    return `${translate(lang, `direction.${spec.direction}`)} · ${translate(lang, 'lesson.count', { n: categories.length })}`;
  }
  return categories.map((c) => categoryLabel(lang, c)).join(', ');
}
