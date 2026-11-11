import { describe, expect, it } from 'vitest';
import { emptyProgress, recordAnswer, type Progress } from './progress.ts';
import { focusPlan, pickFocus, topConfusions, weakestCategories, weakness } from './adaptive.ts';
import { mistakenFor } from '../quiz/round.ts';
import { generateQuestion } from '../quiz/generate.ts';
import type { Question } from '../quiz/types.ts';

const choice = (answer: string, choices: string[]): Question => ({
  module: 'intervals',
  category: answer,
  prompt: { kind: 'choice' },
  sound: { events: [] },
  choices,
  answer,
});

function answers(p: Progress, category: string, right: number, wrongAs: Record<string, number> = {}): Progress {
  for (let i = 0; i < right; i++) p = recordAnswer(p, { category, outcome: 'first-try', points: 10 });
  for (const [as, n] of Object.entries(wrongAs)) {
    for (let i = 0; i < n; i++) p = recordAnswer(p, { category, outcome: 'wrong', points: 0, mistakenFor: [as] });
  }
  return p;
}

describe('mistakenFor', () => {
  it('lists every wrong pick of a choice question', () => {
    const q = choice('interval:m6', ['interval:m6', 'interval:M6', 'interval:P5']);
    expect(mistakenFor(q, ['interval:M6', 'interval:m6'])).toEqual(['interval:M6']);
    expect(mistakenFor(q, ['interval:M6', 'interval:P5'])).toEqual(['interval:M6', 'interval:P5']);
    expect(mistakenFor(q, ['interval:m6'])).toEqual([]);
  });

  it('counts a wrong yes as taking the sound for the asked-about chord', () => {
    const q: Question = {
      module: 'chords',
      category: 'chord:major',
      prompt: { kind: 'yesno', category: 'chord:minor' },
      sound: { events: [] },
      choices: ['yes', 'no'],
      answer: 'no',
    };
    expect(mistakenFor(q, ['yes'])).toEqual(['chord:minor']);
    expect(mistakenFor({ ...q, category: 'chord:minor', answer: 'yes' }, ['no'])).toEqual([]);
  });
});

describe('confusions', () => {
  it('are recorded per played and picked category', () => {
    const p = answers(emptyProgress(), 'interval:m6', 1, { 'interval:M6': 2 });
    expect(p.confusions).toEqual({ 'interval:m6': { 'interval:M6': 2 } });
  });

  it('are listed by rate, ignoring one-offs', () => {
    let p = answers(emptyProgress(), 'interval:m6', 6, { 'interval:M6': 4 });
    p = answers(p, 'interval:P4', 1, { 'interval:P5': 2, 'interval:M3': 1 });
    expect(topConfusions(p)).toEqual([
      { played: 'interval:P4', heardAs: 'interval:P5', count: 2, attempts: 4, rate: 0.5 },
      { played: 'interval:m6', heardAs: 'interval:M6', count: 4, attempts: 10, rate: 0.4 },
    ]);
  });
});

describe('weakness', () => {
  it('is smoothed towards one half', () => {
    expect(weakness(undefined)).toBe(0.5);
    expect(weakness({ attempts: 2, correct: 2 })).toBe(0.25);
    expect(weakness({ attempts: 98, correct: 98 })).toBe(0.01);
  });

  it('ranks answered categories weakest first', () => {
    let p = answers(emptyProgress(), 'note:0', 9, { 'note:7': 1 });
    p = answers(p, 'note:7', 2, { 'note:0': 3 });
    expect(weakestCategories(p).map((w) => w.category)).toEqual(['note:7', 'note:0']);
  });
});

describe('focus training', () => {
  it('targets the weakest learned categories plus their mix-up partners', () => {
    // All white keys learned via practice; D is weak and mixed up with E (strong).
    let p = emptyProgress();
    for (const pc of [0, 2, 4, 5, 7, 9, 11]) p = answers(p, `note:${pc}`, 20);
    p = answers(p, 'note:2', 0, { 'note:4': 6 });
    p = answers(p, 'note:9', 2, { 'note:11': 3 });
    const notes = focusPlan(p).find((part) => part.module === 'notes')!;
    expect(notes.categories).toContain('note:2');
    expect(notes.categories).toContain('note:4');
    expect(notes.categories).toContain('note:9');
    expect(notes.categories).toContain('note:11');
    expect(notes.spec).toEqual({ module: 'notes', pitchClasses: notes.categories.map((c) => Number(c.split(':')[1])) });
  });

  it('includes partners never played themselves', () => {
    const p = answers(emptyProgress(), 'note:0', 1, { 'note:2': 3 });
    expect(focusPlan(p).find((part) => part.module === 'notes')!.categories).toEqual(['note:0', 'note:2', 'note:7']);
  });

  it('asks weak categories far more often than strong ones', () => {
    let p = answers(emptyProgress(), 'note:0', 50);
    p = answers(p, 'note:7', 0, { 'note:0': 10 });
    const plan = focusPlan(p);
    let seed = 1;
    const rng = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const counts: Record<string, number> = {};
    for (let i = 0; i < 1000; i++) {
      const { category } = pickFocus(plan, p, rng);
      counts[category] = (counts[category] ?? 0) + 1;
    }
    expect(counts['note:7']!).toBeGreaterThan(counts['note:0']! * 5);
  });

  it('generates a question for the picked category', () => {
    const plan = focusPlan(emptyProgress());
    const { spec, category } = pickFocus(plan, emptyProgress(), () => 0.99);
    expect(generateQuestion(spec, () => 0, { category }).answer).toBe(category);
  });
});
