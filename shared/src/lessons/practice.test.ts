import { describe, expect, it } from 'vitest';
import { practiceCategories, practiceSpec } from './practice.ts';
import { generateQuestion } from '../quiz/generate.ts';

describe('free practice', () => {
  it('offers all 12 notes regardless of unlocks', () => {
    expect(practiceCategories('notes')).toHaveLength(12);
  });

  it('builds a spec that only asks the chosen categories', () => {
    const spec = practiceSpec('notes', ['note:1', 'note:11']);
    const q = generateQuestion(spec, () => 0.99);
    expect(q.choices).toEqual(['note:1', 'note:11']);
  });

  it('offers all intervals with a chosen direction', () => {
    expect(practiceCategories('intervals')).toHaveLength(12);
    const spec = practiceSpec('intervals', ['interval:m2', 'interval:TT'], { direction: 'harmonic' });
    expect(spec).toEqual({ module: 'intervals', intervals: ['m2', 'TT'], direction: 'harmonic' });
    const q = generateQuestion(spec, () => 0);
    expect(q.choices).toEqual(['interval:m2', 'interval:TT']);
  });

  it('offers all chord qualities as multiple choice', () => {
    expect(practiceCategories('chords')).toHaveLength(7);
    const spec = practiceSpec('chords', ['chord:dim', 'chord:maj7']);
    expect(generateQuestion(spec, () => 0).choices).toEqual(['chord:dim', 'chord:maj7']);
  });
});
