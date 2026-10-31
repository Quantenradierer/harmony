import type { PitchClass } from '../music/pitch.ts';
import type { ModuleId } from '../quiz/types.ts';
import notes from './data/notes.json' with { type: 'json' };

export interface NotesSpec {
  module: 'notes';
  pitchClasses: PitchClass[];
}

/** What a lesson or a free-practice session asks about. */
export type QuizSpec = NotesSpec;

export interface Lesson {
  id: string;
  spec: QuizSpec;
}

/** Lesson paths per module, in order. Loaded from the data files. */
export const LESSONS: Record<ModuleId, Lesson[]> = {
  notes: notes as Lesson[],
  intervals: [],
  chords: [],
};

export function findLesson(id: string): Lesson | undefined {
  return Object.values(LESSONS)
    .flat()
    .find((l) => l.id === id);
}
