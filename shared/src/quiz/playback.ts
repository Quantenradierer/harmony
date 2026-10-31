import type { NoteEvent, Sound } from './types.ts';

/** How several notes meant to sound together are played. */
export type Playback = 'together' | 'sequence';

export const STEP = 0.8;
export const HOLD = 1.8;

/** Notes one after another. */
export function melodic(midis: number[]): Sound {
  return {
    events: midis.map((midi, i) => ({ midi, time: i * STEP, duration: STEP })),
  };
}

/**
 * Notes together. With 'sequence' playback they are first played one by one,
 * then together, so the learner can hear each note and the whole.
 */
export function harmonic(midis: number[], playback: Playback): Sound {
  const together = (time: number): NoteEvent[] => midis.map((midi) => ({ midi, time, duration: HOLD }));
  if (playback === 'together') return { events: together(0) };
  const arpeggio = melodic(midis).events;
  return { events: [...arpeggio, ...together(midis.length * STEP)] };
}
