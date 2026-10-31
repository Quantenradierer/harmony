import { describe, expect, it } from 'vitest';
import { createRound, answerRound } from './round.ts';
import type { Question } from './types.ts';

const question = (choices: string[], answer: string): Question => ({
  module: 'notes',
  category: `note:${answer}`,
  prompt: { kind: 'choice' },
  sound: { events: [] },
  choices,
  answer,
});

describe('quiz round', () => {
  it('finishes on a correct first try', () => {
    let round = createRound(question(['a', 'b', 'c'], 'b'));
    round = answerRound(round, 'b');
    expect(round.picks).toEqual(['b']);
    expect(round.done).toBe(true);
    expect(round.outcome).toBe('first-try');
  });

  it('allows a second try after a wrong first pick', () => {
    let round = createRound(question(['a', 'b', 'c'], 'b'));
    round = answerRound(round, 'a');
    expect(round.done).toBe(false);
    round = answerRound(round, 'b');
    expect(round.done).toBe(true);
    expect(round.outcome).toBe('second-try');
  });

  it('fails after two wrong picks', () => {
    let round = createRound(question(['a', 'b', 'c'], 'b'));
    round = answerRound(round, 'a');
    round = answerRound(round, 'c');
    expect(round.done).toBe(true);
    expect(round.outcome).toBe('wrong');
  });

  it('gives no second try when only two choices exist', () => {
    let round = createRound(question(['yes', 'no'], 'no'));
    round = answerRound(round, 'yes');
    expect(round.done).toBe(true);
    expect(round.outcome).toBe('wrong');
  });

  it('ignores repeated or late picks', () => {
    let round = createRound(question(['a', 'b', 'c'], 'b'));
    round = answerRound(round, 'a');
    round = answerRound(round, 'a');
    expect(round.picks).toEqual(['a']);
    round = answerRound(round, 'b');
    round = answerRound(round, 'c');
    expect(round.picks).toEqual(['a', 'b']);
  });

  it('rejects unknown answers', () => {
    const round = createRound(question(['a', 'b'], 'b'));
    expect(() => answerRound(round, 'x')).toThrow();
  });
});
