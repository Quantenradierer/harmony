/** Chord qualities as semitones above the root, in root position. */
export const CHORDS = {
  maj: [0, 4, 7],
  min: [0, 3, 7],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
  dom7: [0, 4, 7, 10],
  maj7: [0, 4, 7, 11],
  min7: [0, 3, 7, 10],
} as const;

export type ChordId = keyof typeof CHORDS;
export const CHORD_IDS = Object.keys(CHORDS) as ChordId[];

/**
 * MIDI notes of a chord on `root`, lowest first. Inversion n moves the n
 * lowest notes up an octave (1 = first inversion, 2 = second, …).
 */
export function chordNotes(id: ChordId, root: number, inversion = 0): number[] {
  const notes = CHORDS[id].map((s) => root + s);
  if (inversion < 0 || inversion >= notes.length) throw new Error(`no inversion ${inversion} for ${id}`);
  return [...notes.slice(inversion), ...notes.slice(0, inversion).map((n) => n + 12)];
}
