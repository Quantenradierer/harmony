import { describe, expect, it } from 'vitest';
import { get } from 'svelte/store';
import { generateNoteQuestion } from '@harmony/shared';
import { QuizController, type QuizResult } from './controller.ts';
import { Player } from '../audio/player.ts';
import { FakeInstrument } from '../audio/fake.ts';

function setup(pitchClasses = [0, 7], reference?: () => { events: { midi: number; time: number; duration: number }[] } | undefined) {
  const instrument = new FakeInstrument();
  const player = new Player({ instrument: async () => instrument, now: () => 0 });
  const results: QuizResult[] = [];
  const quiz = new QuizController({
    nextQuestion: () => generateNoteQuestion({ pitchClasses }, () => 0),
    player,
    onResult: (r) => results.push(r),
    reference,
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

  it('plays the reference pitch before each question when enabled', async () => {
    let on = true;
    const ref = { events: [{ midi: 60, time: 0, duration: 1 }] };
    const { quiz, instrument } = setup([7], () => (on ? ref : undefined));
    await quiz.next();
    expect(instrument.played.map((p) => p.midi)).toEqual([60, 67]);
    await quiz.replay();
    expect(instrument.played.map((p) => p.midi)).toEqual([60, 67, 67]);
    await quiz.replayReference();
    expect(instrument.played.map((p) => p.midi)).toEqual([60, 67, 67, 60]);
    on = false;
    await quiz.next();
    expect(instrument.played.map((p) => p.midi)).toEqual([60, 67, 67, 60, 67]);
  });

  describe('training length', () => {
    function finishing() {
      const player = new Player({ instrument: async () => new FakeInstrument(), now: () => 0 });
      const finished: number[] = [];
      const quiz = new QuizController({
        nextQuestion: () => generateNoteQuestion({ pitchClasses: [0, 7] }, () => 0),
        player,
        onFinish: ({ points }) => finished.push(points),
      });
      return { quiz, finished };
    }

    async function answerAll(quiz: QuizController, n: number) {
      for (let i = 0; i < n; i++) {
        await quiz.next();
        quiz.answer('note:0');
      }
    }

    it('ends after 20 questions and reports the score once', async () => {
      const { quiz, finished } = finishing();
      await answerAll(quiz, 19);
      expect(get(quiz.state).finished).toBe(false);
      expect(finished).toEqual([]);
      await answerAll(quiz, 1);
      expect(get(quiz.state).finished).toBe(true);
      expect(finished).toEqual([285]);
      // Nothing more happens after the end.
      await quiz.next();
      quiz.answer('note:0');
      expect(finished).toEqual([285]);
      expect(get(quiz.state).answered).toBe(20);
    });

    it('restart begins a new training with a fresh score', async () => {
      const { quiz, finished } = finishing();
      await answerAll(quiz, 20);
      await quiz.restart();
      expect(get(quiz.state)).toMatchObject({ finished: false, answered: 0, session: { points: 0, streak: 0 } });
      quiz.answer('note:0');
      expect(get(quiz.state).session.points).toBe(10);
      await answerAll(quiz, 19);
      expect(finished).toEqual([285, 285]);
    });
  });
});
