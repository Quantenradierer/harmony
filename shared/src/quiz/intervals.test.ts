import { describe, expect, it } from 'vitest';
import { generateIntervalQuestion } from './intervals.ts';
import { INTERVAL_IDS, INTERVALS } from '../music/intervals.ts';

/** rng returning the given values in turn: [interval pick, root pitch class, register...] */
const seq = (...values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length]!;
};

const midis = (q: ReturnType<typeof generateIntervalQuestion>) => q.sound.events.map((e) => e.midi);

describe('interval maths', () => {
  it('covers minor 2nd to octave as 1..12 semitones', () => {
    expect(INTERVAL_IDS.map((id) => INTERVALS[id])).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });
});

describe('interval questions', () => {
  it('plays every interval ascending with the right size', () => {
    for (const id of INTERVAL_IDS) {
      const q = generateIntervalQuestion({ module: 'intervals', intervals: [id], direction: 'ascending' }, seq(0, 0));
      const [a, b] = midis(q);
      expect(b! - a!).toBe(INTERVALS[id]);
      expect(q.sound.events[1]!.time).toBeGreaterThan(q.sound.events[0]!.time);
      expect(q.answer).toBe(`interval:${id}`);
    }
  });

  it('plays every interval descending with the right size', () => {
    for (const id of INTERVAL_IDS) {
      const q = generateIntervalQuestion({ module: 'intervals', intervals: [id], direction: 'descending' }, seq(0, 0));
      const [a, b] = midis(q);
      expect(a! - b!).toBe(INTERVALS[id]);
      expect(q.sound.events[1]!.time).toBeGreaterThan(q.sound.events[0]!.time);
    }
  });

  it('plays harmonic intervals together by default', () => {
    for (const id of INTERVAL_IDS) {
      const q = generateIntervalQuestion({ module: 'intervals', intervals: [id], direction: 'harmonic' }, seq(0, 0));
      expect(q.sound.events.map((e) => e.time)).toEqual([0, 0]);
      const [a, b] = midis(q);
      expect(b! - a!).toBe(INTERVALS[id]);
    }
  });

  it('plays harmonic intervals note by note, then together, when asked', () => {
    const q = generateIntervalQuestion(
      { module: 'intervals', intervals: ['P5'], direction: 'harmonic' },
      seq(0, 0),
      { playback: 'sequence' },
    );
    const times = q.sound.events.map((e) => e.time);
    expect(times[0]).toBeLessThan(times[1]!);
    expect(times[2]).toBe(times[3]);
    expect(midis(q)).toEqual([60, 67, 60, 67]);
  });

  it('roots the interval in the chosen register', () => {
    const low = generateIntervalQuestion({ module: 'intervals', intervals: ['P5'], direction: 'ascending' }, seq(0, 0), { register: 'low' });
    const high = generateIntervalQuestion({ module: 'intervals', intervals: ['P5'], direction: 'ascending' }, seq(0, 0), { register: 'high' });
    expect(midis(low)[0]).toBe(48);
    expect(midis(high)[0]).toBe(72);
  });

  it('offers the lesson intervals as choices, ordered by size', () => {
    const q = generateIntervalQuestion({ module: 'intervals', intervals: ['P8', 'P5', 'm3'], direction: 'ascending' }, seq(0.5, 0.2));
    expect(q.choices).toEqual(['interval:m3', 'interval:P5', 'interval:P8']);
  });
});
