import { describe, expect, it } from 'vitest';
import { get } from 'svelte/store';
import { generateNoteQuestion } from '@harmony/shared';
import { QuizController, type QuizResult } from './controller.ts';
import { Player } from '../audio/player.ts';
import { FakeInstrument } from '../audio/fake.ts';

function setup(pitchClasses = [0, 7]) {
  const instrument = new FakeInstrument();
  const player = new Player({ instrument: async () => instrument, now: () => 0 });
  const results: QuizResult[] = [];
  const quiz = new QuizController({
    nextQuestion: () => generateNoteQuestion({ pitchClasses }, () => 0),
    player,
    onResult: (r) => results.push(r),
  });
  return { quiz, instrument, results };
}

describe('quiz controller', () => {
  it('plays the question sound when a question starts', async () => {
    const { quiz, instrument } = setup();
    await quiz.next();
    expect(get(quiz.state).round!.question.answer).toBe('note:0');
    expect(instrument.played.map((p) => p.midi)).toEqual([60]);
  });

  it('replays the same sound without affecting the score', async () => {
    const { quiz, instrument } = setup();
    await quiz.next();
    await quiz.replay();
    await quiz.replay();
    expect(instrument.played.map((p) => p.midi)).toEqual([60, 60, 60]);
    quiz.answer('note:0');
    expect(get(quiz.state).gained).toBe(10);
  });

  it('scores answers and builds a streak across questions', async () => {
    const { quiz, results } = setup();
    await quiz.next();
    quiz.answer('note:0');
    await quiz.next();
    quiz.answer('note:0');
    const s = get(quiz.state);
    expect(s.session).toEqual({ points: 21, streak: 2 });
    expect(results.map((r) => r.outcome)).toEqual(['first-try', 'first-try']);
  });

  it('reports a result once, only when the round is finished', async () => {
    const { quiz, results } = setup([0, 4, 7]);
    await quiz.next();
    quiz.answer('note:4');
    expect(results).toHaveLength(0);
    quiz.answer('note:0');
    expect(results).toEqual([expect.objectContaining({ outcome: 'second-try', points: 5 })]);
    quiz.answer('note:7');
    expect(results).toHaveLength(1);
  });
});
