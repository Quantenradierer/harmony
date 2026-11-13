import { describe, expect, it } from 'vitest';
import { accuracy, categoryTrend, emptyProgress, recordAnswer } from './progress.ts';

describe('category trend', () => {
  it('counts answers per category and day and lists the active days oldest first', () => {
    let p = emptyProgress();
    p = recordAnswer(p, { category: 'note:0', outcome: 'wrong', points: 0, day: '2026-11-12' });
    p = recordAnswer(p, { category: 'note:0', outcome: 'first-try', points: 10, day: '2026-11-10' });
    p = recordAnswer(p, { category: 'note:0', outcome: 'first-try', points: 10, day: '2026-11-12' });
    p = recordAnswer(p, { category: 'note:2', outcome: 'first-try', points: 10, day: '2026-11-12' });
    p = recordAnswer(p, { category: 'note:0', outcome: 'first-try', points: 10 });
    expect(categoryTrend(p, 'note:0')).toEqual([
      { day: '2026-11-10', attempts: 1, correct: 1 },
      { day: '2026-11-12', attempts: 2, correct: 1 },
    ]);
    expect(categoryTrend(p, 'note:0', 1)).toEqual([{ day: '2026-11-12', attempts: 2, correct: 1 }]);
    expect(categoryTrend(p, 'note:4')).toEqual([]);
  });
});

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
