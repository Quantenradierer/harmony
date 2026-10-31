/** Intervals from minor 2nd to octave, keyed by short id. */
export const INTERVALS = {
  m2: 1,
  M2: 2,
  m3: 3,
  M3: 4,
  P4: 5,
  TT: 6,
  P5: 7,
  m6: 8,
  M6: 9,
  m7: 10,
  M7: 11,
  P8: 12,
} as const;

export type IntervalId = keyof typeof INTERVALS;

/** Interval ids sorted by size. */
export const INTERVAL_IDS = Object.keys(INTERVALS) as IntervalId[];

export function semitones(id: IntervalId): number {
  return INTERVALS[id];
}

/** Melodic up, melodic down, or both notes at once. */
export type IntervalDirection = 'ascending' | 'descending' | 'harmonic';
export const INTERVAL_DIRECTIONS: IntervalDirection[] = ['ascending', 'descending', 'harmonic'];
