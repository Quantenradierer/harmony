import type { Register } from '../music/register.ts';

/** One note to play, timed in seconds from the start of the sound. */
export interface NoteEvent {
  midi: number;
  time: number;
  duration: number;
}

export interface Sound {
  events: NoteEvent[];
}

export type ModuleId = 'notes' | 'intervals' | 'chords';

/** A question asks "what is this?" (choice) or "is this X?" (yes/no). */
export type Prompt = { kind: 'choice' } | { kind: 'yesno'; category: string };

export interface Question {
  module: ModuleId;
  /** Category of the sound actually played, e.g. "note:0". Used for accuracy. */
  category: string;
  prompt: Prompt;
  sound: Sound;
  /** Answer ids in display order. */
  choices: string[];
  answer: string;
}

/** Learner settings that shape generated questions. */
export interface GenerateOptions {
  register?: Register;
}

/** Source of randomness in [0, 1); injectable for tests. */
export type Rng = () => number;

export function pick<T>(items: readonly T[], rng: Rng): T {
  if (items.length === 0) throw new Error('pick from empty list');
  return items[Math.floor(rng() * items.length)]!;
}
