import { describe, expect, it } from 'vitest';
import { get, writable } from 'svelte/store';
import { emptyProgress, focusPlan, LESSONS, isUnlocked, pickFocus } from '@harmony/shared';
import { createSession } from './session.ts';
import { defaultSettings } from '../settings.ts';
import { Player } from '../audio/player.ts';
import { FakeInstrument } from '../audio/fake.ts';

const settings = writable(defaultSettings());
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
    const quiz = createSession({ spec: first!.spec, lessonId: first!.id, progress, player, settings });
    await answerCorrectly(quiz, 20);
    expect(isUnlocked(get(progress), LESSONS.notes, second!.id)).toBe(true);
    expect(get(progress).totalPoints).toBeGreaterThan(200);
  });

  it('free practice scores but never unlocks lessons', async () => {
    const progress = writable(emptyProgress());
    const quiz = createSession({ spec: LESSONS.notes[0]!.spec, progress, player, settings });
    await answerCorrectly(quiz, 20);
    expect(get(progress).passed).toEqual([]);
    expect(get(progress).totalPoints).toBeGreaterThan(0);
  });

  it('generates questions in the register chosen for the module', async () => {
    const progress = writable(emptyProgress());
    const s = writable({ ...defaultSettings(), registers: { notes: 'high', intervals: 'low', chords: 'low' } as const });
    const quiz = createSession({ spec: LESSONS.notes[0]!.spec, progress, player, settings: s, rng: () => 0 });
    await quiz.next();
    expect(get(quiz.state).round!.question.sound.events[0]!.midi).toBe(72);
  });

  it('counts answers on the day they were given', async () => {
    const progress = writable(emptyProgress());
    const now = () => new Date(2026, 10, 6, 9, 30);
    const quiz = createSession({ spec: LESSONS.notes[0]!.spec, progress, player, settings, now });
    await answerCorrectly(quiz, 3);
    expect(get(progress).days?.['2026-11-06']).toMatchObject({ answers: 3, correct: 3 });
  });

  it('mixes modules when given several specs', async () => {
    const progress = writable(emptyProgress());
    const values = [0.9, 0, 0, 0, 0, 0];
    let i = 0;
    const rng = () => values[i++ % values.length]!;
    const quiz = createSession({ spec: [LESSONS.notes[0]!.spec, LESSONS.intervals[0]!.spec], progress, player, settings, rng });
    await quiz.next();
    expect(get(quiz.state).round!.question.category).toMatch(/^interval:/);
  });

  it('records what a wrongly answered sound was taken for', async () => {
    const progress = writable(emptyProgress());
    const quiz = createSession({ spec: LESSONS.notes[0]!.spec, progress, player, settings, rng: () => 0 });
    await quiz.next();
    quiz.answer('note:7'); // C was played (rng 0); G picked
    expect(get(progress).confusions).toEqual({ 'note:0': { 'note:7': 1 } });
  });

  it('lets an adaptive chooser decide every question', async () => {
    const progress = writable(emptyProgress());
    const plan = focusPlan(emptyProgress());
    const quiz = createSession({ choose: (p, rng) => pickFocus(plan, p, rng), progress, player, settings, rng: () => 0.99 });
    await quiz.next();
    const q = get(quiz.state).round!.question;
    expect(q.category).toBe(plan.at(-1)!.categories.at(-1));
  });
});
