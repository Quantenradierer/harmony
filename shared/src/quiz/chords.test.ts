import { describe, expect, it } from 'vitest';
import { generateChordQuestion } from './chords.ts';
import { createRound, answerRound } from './round.ts';

const seq = (...values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length]!;
};
const midis = (q: ReturnType<typeof generateChordQuestion>) => q.sound.events.map((e) => e.midi);

describe('chord questions', () => {
  it('plays a root-position chord together by default', () => {
    // rng: chord pick, inversion pick, root pitch class, register
    const q = generateChordQuestion({ module: 'chords', chords: ['maj', 'min'], format: 'choice' }, seq(0.6, 0, 0));
    expect(q.answer).toBe('chord:min');
    expect(midis(q)).toEqual([60, 63, 67]);
    expect(q.sound.events.every((e) => e.time === 0)).toBe(true);
    expect(q.choices).toEqual(['chord:maj', 'chord:min']);
  });

  it('plays note by note, then together, when asked', () => {
    const q = generateChordQuestion({ module: 'chords', chords: ['maj'], format: 'choice' }, seq(0), {
      playback: 'sequence',
    });
    expect(midis(q)).toEqual([60, 64, 67, 60, 64, 67]);
    const times = q.sound.events.map((e) => e.time);
    expect(times[0]).toBeLessThan(times[1]!);
    expect(new Set(times.slice(3)).size).toBe(1);
  });

  it('uses the inversions of the spec', () => {
    const q = generateChordQuestion(
      { module: 'chords', chords: ['maj'], inversions: [2], format: 'choice' },
      seq(0),
    );
    expect(midis(q)).toEqual([67, 72, 76]);
  });

  it('asks yes/no about the target and answers yes when it plays', () => {
    const q = generateChordQuestion(
      { module: 'chords', chords: ['maj', 'min'], format: 'yesno', target: 'min' },
      seq(0.1, 0, 0),
    );
    expect(q.prompt).toEqual({ kind: 'yesno', category: 'chord:min' });
    expect(q.choices).toEqual(['yes', 'no']);
    expect(q.category).toBe('chord:min');
    expect(q.answer).toBe('yes');
  });

  it('answers no when another chord plays', () => {
    const q = generateChordQuestion(
      { module: 'chords', chords: ['maj', 'min'], format: 'yesno', target: 'min' },
      seq(0.9, 0, 0, 0),
    );
    expect(q.category).toBe('chord:maj');
    expect(q.answer).toBe('no');
    expect(midis(q)).toEqual([60, 64, 67]);
  });

  it('runs yes/no through the same answer rounds (one try only)', () => {
    const q = generateChordQuestion(
      { module: 'chords', chords: ['maj', 'min'], format: 'yesno', target: 'min' },
      seq(0.9, 0, 0, 0),
    );
    const round = answerRound(createRound(q), 'yes');
    expect(round.done).toBe(true);
    expect(round.outcome).toBe('wrong');
  });

  it('requires a target for yes/no', () => {
    expect(() => generateChordQuestion({ module: 'chords', chords: ['maj'], format: 'yesno' }, seq(0))).toThrow();
  });
});
