import type { Language, Lesson } from '@harmony/shared';
import { specCategories } from '@harmony/shared';
import { categoryLabel, translate, yesNoQuestion } from './i18n/index.ts';

/** One-line description of what a lesson asks. */
export function lessonSummary(lesson: Lesson, lang: Language): string {
  const categories = specCategories(lesson.spec);
  const spec = lesson.spec;
  if (spec.module === 'intervals') {
    return `${translate(lang, `direction.${spec.direction}`)} · ${translate(lang, 'lesson.count', { n: categories.length })}`;
  }
  if (spec.module === 'chords' && spec.format === 'yesno' && spec.target) {
    return yesNoQuestion(lang, `chord:${spec.target}`);
  }
  const names = categories.map((c) => categoryLabel(lang, c)).join(', ');
  if (spec.module === 'chords' && (spec.inversions ?? [0]).some((i) => i > 0)) {
    return `${names} · ${translate(lang, 'lesson.inversions')}`;
  }
  return names;
}
