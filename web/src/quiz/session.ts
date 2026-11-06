import { get, type Readable, type Writable } from 'svelte/store';
import {
  dayKey,
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
  /** What to ask; with several specs each question picks one at random (mixed trainings). */
  spec: QuizSpec | QuizSpec[];
  progress: Writable<Progress>;
  player: Player;
  settings: Readable<Settings>;
  /** Set for lessons; free practice does not count towards gates. */
  lessonId?: string;
  rng?: Rng;
  /** Clock for the per-day statistics. */
  now?: () => Date;
  /** Called with the final score when the training's last question is answered. */
  onFinish?: (result: { points: number }) => void;
}

/** A quiz whose results are written to the learner's progress. */
export function createSession(o: SessionOptions): QuizController {
  const rng = o.rng ?? Math.random;
  const now = o.now ?? (() => new Date());
  const specs = Array.isArray(o.spec) ? o.spec : [o.spec];
  return new QuizController({
    nextQuestion: () => {
      const spec = specs[Math.min(specs.length - 1, Math.floor(rng() * specs.length))]!;
      return generateQuestion(spec, rng, {
        register: get(o.settings).registers[spec.module],
        playback: get(o.settings).playback,
      });
    },
    player: o.player,
    onFinish: o.onFinish,
    reference: () =>
      get(o.settings).referencePitch
        ? { events: [{ midi: REFERENCE_MIDI, time: 0, duration: 1 }] }
        : undefined,
    onResult: ({ question, outcome, points, sessionPoints }) =>
      o.progress.update((p) => {
        let next = recordAnswer(p, { category: question.category, outcome, points, sessionPoints, day: dayKey(now()) });
        if (o.lessonId) next = recordLessonResult(next, o.lessonId, outcome === 'first-try');
        return next;
      }),
  });
}
