import { describe, expect, it } from 'vitest';
import { chordNotes, CHORD_IDS } from './chords.ts';

describe('chord voicings', () => {
  it('builds root-position triads and sevenths on C4', () => {
    expect(chordNotes('maj', 60)).toEqual([60, 64, 67]);
    expect(chordNotes('min', 60)).toEqual([60, 63, 67]);
    expect(chordNotes('dim', 60)).toEqual([60, 63, 66]);
    expect(chordNotes('aug', 60)).toEqual([60, 64, 68]);
    expect(chordNotes('dom7', 60)).toEqual([60, 64, 67, 70]);
    expect(chordNotes('maj7', 60)).toEqual([60, 64, 67, 71]);
    expect(chordNotes('min7', 60)).toEqual([60, 63, 67, 70]);
  });

  it('builds inversions by moving the lowest notes up an octave', () => {
    expect(chordNotes('maj', 60, 1)).toEqual([64, 67, 72]);
    expect(chordNotes('maj', 60, 2)).toEqual([67, 72, 76]);
    expect(chordNotes('min', 57, 1)).toEqual([60, 64, 69]);
    expect(chordNotes('dom7', 67, 3)).toEqual([77, 79, 83, 86]);
  });

  it('keeps notes ascending in every inversion', () => {
    for (const id of CHORD_IDS) {
      for (let inv = 0; inv < (id.endsWith('7') ? 4 : 3); inv++) {
        const notes = chordNotes(id, 60, inv);
        expect([...notes].sort((a, b) => a - b)).toEqual(notes);
      }
    }
  });

  it('rejects impossible inversions', () => {
    expect(() => chordNotes('maj', 60, 3)).toThrow();
  });
});
