import { get, type Readable, type Writable } from 'svelte/store';
import {
  generateQuestion,
  recordAnswer,
  recordLessonResult,
  type Progress,
  type QuizSpec,
  type Rng,
  REFERENCE_MIDI,
} from '@harmony/shared';
import { QuizController } from './controller.ts';
import type { Player } from '../audio/player.ts';
import type { Settings } from '../settings.ts';

export interface SessionOptions {
  spec: QuizSpec;
  progress: Writable<Progress>;
  player: Player;
  settings: Readable<Settings>;
  /** Set for lessons; free practice does not count towards gates. */
  lessonId?: string;
  rng?: Rng;
}

/** A quiz whose results are written to the learner's progress. */
export function createSession(o: SessionOptions): QuizController {
  const rng = o.rng ?? Math.random;
  return new QuizController({
    nextQuestion: () =>
      generateQuestion(o.spec, rng, { register: get(o.settings).registers[o.spec.module] }),
    player: o.player,
    reference: () =>
      get(o.settings).referencePitch
        ? { events: [{ midi: REFERENCE_MIDI, time: 0, duration: 1 }] }
        : undefined,
    onResult: ({ question, outcome, points }) =>
      o.progress.update((p) => {
        let next = recordAnswer(p, { category: question.category, outcome, points });
        if (o.lessonId) next = recordLessonResult(next, o.lessonId, outcome === 'first-try');
        return next;
      }),
  });
}
