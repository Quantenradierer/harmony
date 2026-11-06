import { describe, expect, it } from 'vitest';
import { emptyProgress, recordAnswer, type Progress } from './progress.ts';
import { ACHIEVEMENTS, earnedAchievements, newAchievements, PERFECT_DAY_MIN } from './achievements.ts';
import { completeDaily } from './daily.ts';
import { LESSONS } from '../lessons/lessons.ts';
import { practiceCategories } from '../lessons/practice.ts';

function answer(p: Progress, category: string, firstTry = true, day = '2026-11-06'): Progress {
  return recordAnswer(p, { category, outcome: firstTry ? 'first-try' : 'wrong', points: firstTry ? 10 : 0, day });
}

describe('achievements', () => {
  it('have unique ids and positive targets', () => {
    const ids = ACHIEVEMENTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const a of ACHIEVEMENTS) expect(a.target).toBeGreaterThan(0);
  });

  it('start with none earned', () => {
    expect(earnedAchievements(emptyProgress())).toEqual([]);
  });

  it('earn the first answer, then a perfect day once enough first tries come in', () => {
    let p = answer(emptyProgress(), 'note:0');
    expect(earnedAchievements(p)).toEqual(['first-answer']);
    for (let i = 1; i < PERFECT_DAY_MIN; i++) p = answer(p, 'note:0');
    expect(earnedAchievements(p)).toContain('perfect-day');
    expect(earnedAchievements(answer(p, 'note:0', false))).not.toContain('perfect-day');
  });

  it('need answers in every module for the all-rounder', () => {
    let p = emptyProgress();
    for (const m of ['notes', 'intervals'] as const) p = answer(p, practiceCategories(m)[0]!);
    expect(earnedAchievements(p)).not.toContain('all-modules');
    p = answer(p, practiceCategories('chords')[0]!);
    expect(earnedAchievements(p)).toContain('all-modules');
  });

  it('need every lesson of a module for its master', () => {
    const ids = LESSONS.notes.map((l) => l.id);
    const p = { ...emptyProgress(), passed: ids.slice(0, -1) };
    expect(earnedAchievements(p)).not.toContain('master-notes');
    expect(earnedAchievements({ ...p, passed: ids })).toContain('master-notes');
  });

  it('count practice days in a row, broken by an idle day', () => {
    let p = emptyProgress();
    for (const day of ['2026-11-01', '2026-11-02', '2026-11-04', '2026-11-05', '2026-11-06']) p = answer(p, 'note:0', false, day);
    expect(earnedAchievements(p)).toContain('streak-3');
    expect(earnedAchievements(p)).not.toContain('streak-7');
    const streak7 = ACHIEVEMENTS.find((a) => a.id === 'streak-7')!;
    expect(streak7.value(p)).toBe(3);
  });

  it('count daily challenges in a row', () => {
    let p = emptyProgress();
    for (const day of ['2026-11-04', '2026-11-05', '2026-11-06']) p = completeDaily(p, day);
    expect(earnedAchievements(p)).toEqual(expect.arrayContaining(['first-daily', 'daily-streak-3']));
    expect(earnedAchievements(p)).not.toContain('daily-streak-7');
  });

  it('report only the newly earned ones', () => {
    const before = answer(emptyProgress(), 'note:0');
    const after = completeDaily(before, '2026-11-06');
    expect(newAchievements(before, after).map((a) => a.id)).toEqual(['first-daily']);
    expect(newAchievements(after, after)).toEqual([]);
  });
});
