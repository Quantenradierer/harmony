import { describe, expect, it } from 'vitest';
import { get } from 'svelte/store';
import { generateNoteQuestion } from '@harmony/shared';
import { QuizController } from './controller.ts';
import { Player } from '../audio/player.ts';
import { FakeInstrument } from '../audio/fake.ts';

function setup() {
  const instrument = new FakeInstrument();
  const player = new Player({ instrument: async () => instrument, now: () => 0 });
  const quiz = new QuizController({
    nextQuestion: () => generateNoteQuestion({ pitchClasses: [0, 7] }, () => 0),
    player,
  });
  return { quiz, instrument };
}

describe('quiz controller', () => {
  it('plays the question sound when a question starts', async () => {
    const { quiz, instrument } = setup();
    await quiz.next();
    const round = get(quiz.state).round!;
    expect(round.question.answer).toBe('note:0');
    expect(instrument.played.map((p) => p.midi)).toEqual([60]);
  });

  it('replays the same sound', async () => {
    const { quiz, instrument } = setup();
    await quiz.next();
    await quiz.replay();
    expect(instrument.played.map((p) => p.midi)).toEqual([60, 60]);
  });

  it('records answers on the round', async () => {
    const { quiz } = setup();
    await quiz.next();
    quiz.answer('note:7');
    expect(get(quiz.state).round!.done).toBe(true);
    expect(get(quiz.state).round!.outcome).toBe('wrong');
  });
});
