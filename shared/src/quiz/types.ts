import type { Register } from '../music/register.ts';
import type { Playback } from './playback.ts';

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
  playback?: Playback;
  /** Ask this category if the spec offers it (choice questions); otherwise pick at random. */
  category?: string;
}

/** Source of randomness in [0, 1); injectable for tests. */
export type Rng = () => number;

export function pick<T>(items: readonly T[], rng: Rng): T {
  if (items.length === 0) throw new Error('pick from empty list');
  return items[Math.floor(rng() * items.length)]!;
}

/** The forced category if `items` offers it, otherwise a random pick. */
export function pickCategory<T>(items: readonly T[], toCategory: (item: T) => string, rng: Rng, forced?: string): T {
  const match = forced === undefined ? undefined : items.find((i) => toCategory(i) === forced);
  return match ?? pick(items, rng);
}
