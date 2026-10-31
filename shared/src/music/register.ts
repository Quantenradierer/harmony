import type { Rng } from '../quiz/types.ts';

/** Octave choice per module. Random picks a register per question. */
export type Register = 'low' | 'medium' | 'high' | 'random';
export const REGISTERS: Register[] = ['low', 'medium', 'high', 'random'];

/** Scientific-pitch octave of the lowest note for each fixed register. */
const OCTAVES = { low: 3, medium: 4, high: 5 } as const;

export function registerOctave(register: Register, rng: Rng): number {
  if (register === 'random') {
    const fixed = Object.values(OCTAVES);
    return fixed[Math.floor(rng() * fixed.length)]!;
  }
  return OCTAVES[register];
}

/** The anchor tone played before questions: C4. */
export const REFERENCE_MIDI = 60;
