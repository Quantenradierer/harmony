import type { QuizSpec } from '../lessons/lessons.ts';
import { generateNoteQuestion } from './notes.ts';
import { generateIntervalQuestion, intervalCategory } from './intervals.ts';
import { chordCategory, generateChordQuestion } from './chords.ts';
import { noteId } from './notes.ts';
import { CHORD_IDS } from '../music/chords.ts';
import { INTERVAL_IDS } from '../music/intervals.ts';
import type { GenerateOptions, Question, Rng } from './types.ts';

/** One entry point for every module's question generator. */
export function generateQuestion(spec: QuizSpec, rng: Rng, options: GenerateOptions = {}): Question {
  switch (spec.module) {
    case 'notes':
      return generateNoteQuestion(spec, rng, options);
    case 'intervals':
      return generateIntervalQuestion(spec, rng, options);
    case 'chords':
      return generateChordQuestion(spec, rng, options);
  }
}

/** All sound categories a spec can produce, in display order. */
export function specCategories(spec: QuizSpec): string[] {
  switch (spec.module) {
    case 'notes':
      return [...spec.pitchClasses].sort((a, b) => a - b).map(noteId);
    case 'intervals':
      return INTERVAL_IDS.filter((id) => spec.intervals.includes(id)).map(intervalCategory);
    case 'chords':
      return CHORD_IDS.filter((id) => spec.chords.includes(id)).map(chordCategory);
  }
}
