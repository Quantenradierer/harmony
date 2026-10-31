import type { PitchClass } from '../music/pitch.ts';
import type { ModuleId } from '../quiz/types.ts';
import type { IntervalsSpec } from '../quiz/intervals.ts';
import type { ChordsSpec } from '../quiz/chords.ts';
import notes from './data/notes.json' with { type: 'json' };
import intervals from './data/intervals.json' with { type: 'json' };
import chords from './data/chords.json' with { type: 'json' };

export interface NotesSpec {
  module: 'notes';
  pitchClasses: PitchClass[];
}

/** What a lesson or a free-practice session asks about. */
export type QuizSpec = NotesSpec | IntervalsSpec | ChordsSpec;

export interface Lesson {
  id: string;
  spec: QuizSpec;
  /** Categories new in this lesson; their theory cards are shown. */
  introduces?: string[];
}

/** Lesson paths per module, in order. Loaded from the data files. */
export const LESSONS: Record<ModuleId, Lesson[]> = {
  notes: notes as Lesson[],
  intervals: intervals as Lesson[],
  chords: chords as Lesson[],
};

export function findLesson(id: string): Lesson | undefined {
  return Object.values(LESSONS)
    .flat()
    .find((l) => l.id === id);
}
