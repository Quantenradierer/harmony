import { describe, expect, it } from 'vitest';
import { medalFor, pointsMedal } from './medals.ts';
import { recordAnswer, emptyProgress } from './progress.ts';

describe('medalFor', () => {
  it('needs enough attempts', () => {
    expect(medalFor(undefined)).toBeUndefined();
    expect(medalFor({ attempts: 9, correct: 9 })).toBeUndefined();
  });
  it('grades by accuracy', () => {
    expect(medalFor({ attempts: 10, correct: 10 })).toBe('gold');
    expect(medalFor({ attempts: 10, correct: 8 })).toBe('silver');
    expect(medalFor({ attempts: 10, correct: 6 })).toBe('bronze');
    expect(medalFor({ attempts: 10, correct: 5 })).toBeUndefined();
  });
});

describe('pointsMedal', () => {
  it('grades by milestones', () => {
    expect(pointsMedal(99)).toBeUndefined();
    expect(pointsMedal(100)).toBe('bronze');
    expect(pointsMedal(2000)).toBe('gold');
  });
});

describe('bestSession', () => {
  it('keeps the highest session score', () => {
    let p = recordAnswer(emptyProgress(), { category: 'a', outcome: 'first-try', points: 5, sessionPoints: 5 });
    p = recordAnswer(p, { category: 'a', outcome: 'wrong', points: 0, sessionPoints: 3 });
    expect(p.bestSession).toBe(5);
  });
});
