import type { ModuleId } from '../quiz/types.ts';
import { noteId } from '../quiz/notes.ts';
import { intervalCategory } from '../quiz/intervals.ts';
import { INTERVAL_IDS, type IntervalDirection, type IntervalId } from '../music/intervals.ts';
import type { QuizSpec } from './lessons.ts';

/** Extra choices free practice offers beside the categories. */
export interface PracticeOptions {
  direction?: IntervalDirection;
}

/** Every category free practice offers for a module, in display order. */
export function practiceCategories(module: ModuleId): string[] {
  switch (module) {
    case 'notes':
      return Array.from({ length: 12 }, (_, pc) => noteId(pc));
    case 'intervals':
      return INTERVAL_IDS.map(intervalCategory);
    default:
      return [];
  }
}

/** Builds a quiz spec from freely chosen categories. */
export function practiceSpec(
  module: ModuleId,
  categories: string[],
  options: PracticeOptions = {},
): QuizSpec {
  const values = categories.map((c) => c.split(':')[1]!);
  switch (module) {
    case 'notes':
      return { module: 'notes', pitchClasses: values.map(Number) };
    case 'intervals':
      return {
        module: 'intervals',
        intervals: values as IntervalId[],
        direction: options.direction ?? 'ascending',
      };
    default:
      throw new Error(`no practice for ${module}`);
  }
}
