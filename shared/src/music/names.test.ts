import { describe, expect, it } from 'vitest';
import { noteName } from './names.ts';

describe('note names', () => {
  it('uses H for B-natural and B for B-flat in German', () => {
    expect(noteName(11, 'de')).toBe('H');
    expect(noteName(10, 'de')).toBe('Ais/B');
  });

  it('uses B and B♭ in English', () => {
    expect(noteName(11, 'en')).toBe('B');
    expect(noteName(10, 'en')).toBe('A♯/B♭');
  });

  it('names white keys alike in both languages, except B/H', () => {
    for (const pc of [0, 2, 4, 5, 7, 9]) {
      expect(noteName(pc, 'de')).toBe(noteName(pc, 'en'));
    }
  });

  it('uses German sharp/flat syllables', () => {
    expect([1, 3, 6, 8].map((pc) => noteName(pc, 'de'))).toEqual(['Cis/Des', 'Dis/Es', 'Fis/Ges', 'Gis/As']);
    expect([1, 3, 6, 8].map((pc) => noteName(pc, 'en'))).toEqual(['C♯/D♭', 'D♯/E♭', 'F♯/G♭', 'G♯/A♭']);
  });

  it('wraps pitch classes', () => {
    expect(noteName(12, 'en')).toBe('C');
    expect(noteName(-1, 'de')).toBe('H');
  });
});
