import { describe, expect, it } from 'vitest';
import { LESSONS } from './lessons.ts';
import { theoryCard } from './theory.ts';
import { generateQuestion, specCategories } from '../quiz/generate.ts';
import { INTERVAL_IDS } from '../music/intervals.ts';
import type { IntervalsSpec } from '../quiz/intervals.ts';
import type { ChordsSpec } from '../quiz/chords.ts';

const all = Object.values(LESSONS).flat();

describe('lesson data', () => {
  it('has unique lesson ids', () => {
    expect(new Set(all.map((l) => l.id)).size).toBe(all.length);
  });

  it('only asks about categories the lesson lists', () => {
    for (const lesson of all) {
      const categories = specCategories(lesson.spec);
      expect(categories.length).toBeGreaterThanOrEqual(2);
      const q = generateQuestion(lesson.spec, Math.random);
      expect(categories).toContain(q.category);
    }
  });

  it('follows the notes path C,G → +E → +F → white → +black → all 12', () => {
    expect(LESSONS.notes.map((l) => specCategories(l.spec).length)).toEqual([2, 3, 4, 7, 9, 12]);
  });

  it('introduces intervals by distinctiveness, hard neighbours last', () => {
    const order = LESSONS.intervals.flatMap((l) => l.introduces ?? []);
    expect(order.slice(0, 4)).toEqual(['interval:P5', 'interval:P8', 'interval:m3', 'interval:M3']);
    expect(order.slice(-3).sort()).toEqual(['interval:M2', 'interval:TT', 'interval:m2'].sort());
    expect(new Set(order).size).toBe(INTERVAL_IDS.length);
  });

  it('goes ascending, then descending, then harmonic', () => {
    const directions = LESSONS.intervals.map((l) => (l.spec as IntervalsSpec).direction);
    const firstOf = (d: string) => directions.indexOf(d as IntervalsSpec['direction']);
    expect(firstOf('ascending')).toBe(0);
    expect(firstOf('descending')).toBeGreaterThan(directions.lastIndexOf('ascending'));
    expect(firstOf('harmonic')).toBeGreaterThan(directions.lastIndexOf('descending'));
  });

  it('has a theory card in both languages for every introduced category', () => {
    for (const category of all.flatMap((l) => l.introduces ?? [])) {
      expect(theoryCard(category, 'de'), category).toBeTruthy();
      expect(theoryCard(category, 'en'), category).toBeTruthy();
    }
  });

  it('introduces chord types in order: major/minor, dim/aug, sevenths', () => {
    const order = LESSONS.chords.flatMap((l) => l.introduces ?? []);
    expect(order).toEqual(['chord:maj', 'chord:min', 'chord:dim', 'chord:aug', 'chord:dom7', 'chord:maj7', 'chord:min7']);
  });

  it('asks yes/no in the first lesson of each new chord type, multiple choice later', () => {
    for (const lesson of LESSONS.chords) {
      const spec = lesson.spec as ChordsSpec;
      if (lesson.introduces) expect(spec.format, lesson.id).toBe('yesno');
    }
    const formats = LESSONS.chords.map((l) => (l.spec as ChordsSpec).format);
    expect(formats.at(-1)).toBe('choice');
    expect(formats.filter((f) => f === 'choice').length).toBeGreaterThan(3);
  });

  it('has a few inversion lessons', () => {
    const withInversions = LESSONS.chords.filter((l) => ((l.spec as ChordsSpec).inversions ?? [0]).some((i) => i > 0));
    expect(withInversions.length).toBeGreaterThanOrEqual(2);
  });
});
