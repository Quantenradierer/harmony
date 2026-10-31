import { describe, expect, it } from 'vitest';
import { generateNoteQuestion } from './notes.ts';
import { pitchClass } from '../music/pitch.ts';

const seq = (...values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length]!;
};

describe('note questions', () => {
  it('plays one note from the given pitch classes', () => {
    const q = generateNoteQuestion({ pitchClasses: [0, 7] }, seq(0.9));
    expect(q.module).toBe('notes');
    expect(q.sound.events).toHaveLength(1);
    expect(pitchClass(q.sound.events[0]!.midi)).toBe(7);
    expect(q.answer).toBe('note:7');
    expect(q.category).toBe('note:7');
  });

  it('offers every pitch class as a choice, in chromatic order', () => {
    const q = generateNoteQuestion({ pitchClasses: [7, 0, 4] }, seq(0));
    expect(q.choices).toEqual(['note:0', 'note:4', 'note:7']);
    expect(q.prompt).toEqual({ kind: 'choice' });
  });

  it('plays in octave 4 by default', () => {
    const q = generateNoteQuestion({ pitchClasses: [0] }, seq(0));
    expect(q.sound.events[0]!.midi).toBe(60);
  });

  it('only ever picks from the given pitch classes', () => {
    let r = 0;
    const rng = () => (r = (r + 0.137) % 1);
    for (let i = 0; i < 50; i++) {
      const q = generateNoteQuestion({ pitchClasses: [0, 7] }, rng);
      expect([0, 7]).toContain(pitchClass(q.sound.events[0]!.midi));
    }
  });
});
