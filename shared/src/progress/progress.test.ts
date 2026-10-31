import { describe, expect, it } from 'vitest';
import { accuracy, emptyProgress, recordAnswer } from './progress.ts';

describe('progress', () => {
  it('adds points to the all-time total', () => {
    const p = recordAnswer(emptyProgress(), { category: 'note:0', outcome: 'first-try', points: 10 });
    expect(p.totalPoints).toBe(10);
  });

  it('tracks accuracy per category, counting first tries only', () => {
    let p = emptyProgress();
    p = recordAnswer(p, { category: 'note:0', outcome: 'first-try', points: 10 });
    p = recordAnswer(p, { category: 'note:0', outcome: 'second-try', points: 5 });
    p = recordAnswer(p, { category: 'note:0', outcome: 'first-try', points: 10 });
    p = recordAnswer(p, { category: 'note:0', outcome: 'wrong', points: 0 });
    p = recordAnswer(p, { category: 'note:7', outcome: 'wrong', points: 0 });
    expect(p.categories['note:0']).toEqual({ attempts: 4, correct: 2 });
    expect(accuracy(p.categories['note:0'])).toBe(0.5);
    expect(accuracy(p.categories['note:7'])).toBe(0);
  });

  it('reports no accuracy for unseen categories', () => {
    expect(accuracy(undefined)).toBeUndefined();
  });

  it('does not mutate the input', () => {
    const p = emptyProgress();
    recordAnswer(p, { category: 'note:0', outcome: 'first-try', points: 10 });
    expect(p).toEqual(emptyProgress());
  });
});
