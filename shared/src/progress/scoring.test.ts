import { describe, expect, it } from 'vitest';
import { scoreAnswer, POINTS_FIRST_TRY, POINTS_SECOND_TRY, STREAK_BONUS_MAX } from './scoring.ts';

describe('scoring', () => {
  it('gives full points for a correct first try', () => {
    expect(scoreAnswer(0, 'first-try')).toEqual({ points: POINTS_FIRST_TRY, streak: 1 });
  });

  it('gives half points for a correct second try and resets the streak', () => {
    expect(POINTS_SECOND_TRY).toBe(POINTS_FIRST_TRY / 2);
    expect(scoreAnswer(4, 'second-try')).toEqual({ points: POINTS_SECOND_TRY, streak: 0 });
  });

  it('gives nothing for a wrong answer and resets the streak', () => {
    expect(scoreAnswer(7, 'wrong')).toEqual({ points: 0, streak: 0 });
  });

  it('adds a small bonus per streak step', () => {
    expect(scoreAnswer(1, 'first-try').points).toBe(POINTS_FIRST_TRY + 1);
    expect(scoreAnswer(2, 'first-try').points).toBe(POINTS_FIRST_TRY + 2);
  });

  it('caps the streak bonus', () => {
    expect(scoreAnswer(50, 'first-try').points).toBe(POINTS_FIRST_TRY + STREAK_BONUS_MAX);
  });

  it('is not affected by replays (no replay input exists)', () => {
    // Replays are free by design: scoreAnswer takes no replay count.
    expect(scoreAnswer.length).toBe(2);
  });
});
