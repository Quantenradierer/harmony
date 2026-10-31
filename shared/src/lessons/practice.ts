import type { ModuleId } from '../quiz/types.ts';
import { noteId } from '../quiz/notes.ts';
import type { QuizSpec } from './lessons.ts';

/** Every category free practice offers for a module, in display order. */
export function practiceCategories(module: ModuleId): string[] {
  switch (module) {
    case 'notes':
      return Array.from({ length: 12 }, (_, pc) => noteId(pc));
    default:
      return [];
  }
}

/** Builds a quiz spec from freely chosen categories. */
export function practiceSpec(module: ModuleId, categories: string[]): QuizSpec {
  const values = categories.map((c) => c.split(':')[1]!);
  switch (module) {
    case 'notes':
      return { module: 'notes', pitchClasses: values.map(Number) };
    default:
      throw new Error(`no practice for ${module}`);
  }
}
