import { describe, expect, it } from 'vitest';
import { GATE, isUnlocked, lessonPassed, lessonScore, recordLessonResult } from './gating.ts';
import { emptyProgress } from '../progress/progress.ts';
import type { Lesson } from './lessons.ts';

const path: Lesson[] = ['a', 'b', 'c'].map((id) => ({
  id,
  spec: { module: 'notes', pitchClasses: [0] },
}));

const results = (correct: number, wrong: number) => [
  ...Array<boolean>(wrong).fill(false),
  ...Array<boolean>(correct).fill(true),
];

describe('lesson gating', () => {
  it('uses 80% over 20 questions', () => {
    expect(GATE).toEqual({ threshold: 0.8, window: 20 });
  });

  it('does not pass with fewer than 20 answers, even if all correct', () => {
    expect(lessonPassed(results(19, 0))).toBe(false);
  });

  it('passes at exactly 80% over 20', () => {
    expect(lessonPassed(results(16, 4))).toBe(true);
  });

  it('does not pass just below the threshold', () => {
    expect(lessonPassed(results(15, 5))).toBe(false);
  });

  it('only looks at the most recent window', () => {
    const history = [...results(0, 30), ...results(20, 0)];
    expect(lessonPassed(history)).toBe(true);
  });

  it('honours a custom gate', () => {
    expect(lessonPassed(results(3, 1), { threshold: 0.75, window: 4 })).toBe(true);
  });

  it('scores the recent window', () => {
    expect(lessonScore(results(8, 2))).toEqual({ answered: 10, correct: 8 });
    expect(lessonScore(results(30, 0)).answered).toBe(20);
  });

  it('unlocks only the first lesson at the start', () => {
    const p = emptyProgress();
    expect(path.map((l) => isUnlocked(p, path, l.id))).toEqual([true, false, false]);
  });

  it('unlocks the next lesson once the gate is reached', () => {
    let p = emptyProgress();
    for (let i = 0; i < 19; i++) p = recordLessonResult(p, 'a', true);
    expect(isUnlocked(p, path, 'b')).toBe(false);
    p = recordLessonResult(p, 'a', true);
    expect(isUnlocked(p, path, 'b')).toBe(true);
    expect(isUnlocked(p, path, 'c')).toBe(false);
  });

  it('keeps a lesson unlocked after later mistakes', () => {
    let p = emptyProgress();
    for (let i = 0; i < 20; i++) p = recordLessonResult(p, 'a', true);
    for (let i = 0; i < 20; i++) p = recordLessonResult(p, 'a', false);
    expect(isUnlocked(p, path, 'b')).toBe(true);
  });

  it('keeps only the recent window of history', () => {
    let p = emptyProgress();
    for (let i = 0; i < 50; i++) p = recordLessonResult(p, 'a', true);
    expect(p.lessonHistory['a']).toHaveLength(GATE.window);
  });
});
