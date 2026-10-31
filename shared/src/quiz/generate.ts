import type { QuizSpec } from '../lessons/lessons.ts';
import { generateNoteQuestion } from './notes.ts';
import type { Question, Rng } from './types.ts';

/** One entry point for every module's question generator. */
export function generateQuestion(spec: QuizSpec, rng: Rng): Question {
  switch (spec.module) {
    case 'notes':
      return generateNoteQuestion(spec, rng);
  }
}

/** All answer categories a spec can produce, in display order. */
export function specCategories(spec: QuizSpec): string[] {
  return generateQuestion(spec, () => 0).choices;
}
