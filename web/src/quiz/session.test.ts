import { describe, expect, it } from 'vitest';
import { get, writable } from 'svelte/store';
import { emptyProgress, LESSONS, isUnlocked } from '@harmony/shared';
import { createSession } from './session.ts';
import { Player } from '../audio/player.ts';
import { FakeInstrument } from '../audio/fake.ts';

const player = new Player({ instrument: async () => new FakeInstrument(), now: () => 0 });

async function answerCorrectly(quiz: ReturnType<typeof createSession>, times: number) {
  for (let i = 0; i < times; i++) {
    await quiz.next();
    let answer = '';
    quiz.state.subscribe((s) => (answer = s.round!.question.answer))();
    quiz.answer(answer);
  }
}

describe('quiz session', () => {
  it('unlocks the next lesson after 20 correct lesson answers', async () => {
    const progress = writable(emptyProgress());
    const [first, second] = LESSONS.notes;
    const quiz = createSession({ spec: first!.spec, lessonId: first!.id, progress, player });
    await answerCorrectly(quiz, 20);
    expect(isUnlocked(get(progress), LESSONS.notes, second!.id)).toBe(true);
    expect(get(progress).totalPoints).toBeGreaterThan(200);
  });

  it('free practice scores but never unlocks lessons', async () => {
    const progress = writable(emptyProgress());
    const quiz = createSession({ spec: LESSONS.notes[0]!.spec, progress, player });
    await answerCorrectly(quiz, 20);
    expect(get(progress).passed).toEqual([]);
    expect(get(progress).totalPoints).toBeGreaterThan(0);
  });
});
