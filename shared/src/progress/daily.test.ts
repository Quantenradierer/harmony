import { describe, expect, it } from 'vitest';
import { emptyProgress, recordAnswer } from './progress.ts';
import {
  completeDaily,
  currentStreak,
  dailyMedal,
  dailySpecs,
  dayKey,
  learnedCategories,
  longestStreak,
  recentDays,
  shiftDay,
} from './daily.ts';
import { LESSONS } from '../lessons/lessons.ts';
import { specCategories } from '../quiz/generate.ts';

describe('day statistics', () => {
  it('formats local days and shifts across month and year ends', () => {
    expect(dayKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(shiftDay('2026-03-01', -1)).toBe('2026-02-28');
    expect(shiftDay('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('counts answers, first tries and points per day', () => {
    let p = emptyProgress();
    p = recordAnswer(p, { category: 'note:0', outcome: 'first-try', points: 10, day: '2026-11-05' });
    p = recordAnswer(p, { category: 'note:0', outcome: 'second-try', points: 5, day: '2026-11-05' });
    p = recordAnswer(p, { category: 'note:0', outcome: 'wrong', points: 0, day: '2026-11-06' });
    expect(p.days).toEqual({
      '2026-11-05': { answers: 2, correct: 1, points: 15 },
      '2026-11-06': { answers: 1, correct: 0, points: 0 },
    });
  });

  it('leaves days alone for answers without a day', () => {
    expect(recordAnswer(emptyProgress(), { category: 'note:0', outcome: 'wrong', points: 0 }).days).toBeUndefined();
  });

  it('lists recent days oldest first, filling idle days with zeros', () => {
    const p = { ...emptyProgress(), days: { '2026-11-05': { answers: 3, correct: 2, points: 25 } } };
    expect(recentDays(p, '2026-11-06', 3)).toEqual([
      { day: '2026-11-04', answers: 0, correct: 0, points: 0 },
      { day: '2026-11-05', answers: 3, correct: 2, points: 25 },
      { day: '2026-11-06', answers: 0, correct: 0, points: 0 },
    ]);
  });
});

describe('daily challenge', () => {
  it('starts with what the first lessons ask', () => {
    const learned = learnedCategories(emptyProgress());
    expect(learned.notes).toEqual(specCategories(LESSONS.notes[0]!.spec));
    expect(learned.intervals).toEqual(['interval:P5', 'interval:P8']);
  });

  it('grows with passed lessons and answered categories', () => {
    const p = {
      ...emptyProgress(),
      passed: ['intervals-1'],
      categories: { 'chord:dim': { attempts: 1, correct: 0 } },
    };
    const learned = learnedCategories(p);
    expect(learned.intervals).toContain('interval:m3');
    expect(learned.chords).toContain('chord:dim');
  });

  it('builds one choice spec per module with enough learned categories', () => {
    const specs = dailySpecs(emptyProgress());
    expect(specs.length).toBeGreaterThan(0);
    for (const s of specs) {
      if (s.module === 'chords') expect(s.format).toBe('choice');
    }
  });

  it('records each day once', () => {
    let p = completeDaily(emptyProgress(), '2026-11-06');
    p = completeDaily(p, '2026-11-05');
    p = completeDaily(p, '2026-11-06');
    expect(p.dailyDone).toEqual(['2026-11-05', '2026-11-06']);
  });

  it('counts the current streak, keeping it while today is still open', () => {
    const done = ['2026-11-01', '2026-11-03', '2026-11-04', '2026-11-05'];
    expect(currentStreak(done, '2026-11-05')).toBe(3);
    expect(currentStreak(done, '2026-11-06')).toBe(3);
    expect(currentStreak(done, '2026-11-07')).toBe(0);
  });

  it('awards medals for the longest streak', () => {
    const week = Array.from({ length: 7 }, (_, i) => shiftDay('2026-10-01', i));
    expect(longestStreak(['2026-11-01', ...week])).toBe(7);
    expect(dailyMedal(week.slice(0, 2))).toBeUndefined();
    expect(dailyMedal(week.slice(0, 3))).toBe('bronze');
    expect(dailyMedal(week)).toBe('silver');
  });
});
