import type { QuizSpec } from '../lessons/lessons.ts';
import { generateNoteQuestion } from './notes.ts';
import { generateIntervalQuestion } from './intervals.ts';
import type { GenerateOptions, Question, Rng } from './types.ts';

/** One entry point for every module's question generator. */
export function generateQuestion(spec: QuizSpec, rng: Rng, options: GenerateOptions = {}): Question {
  switch (spec.module) {
    case 'notes':
      return generateNoteQuestion(spec, rng, options);
    case 'intervals':
      return generateIntervalQuestion(spec, rng, options);
  }
}

/** All answer categories a spec can produce, in display order. */
export function specCategories(spec: QuizSpec): string[] {
  return generateQuestion(spec, () => 0).choices;
}
