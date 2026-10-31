import type { Progress } from '../progress/progress.ts';
import type { Lesson } from './lessons.ts';

export interface Gate {
  /** Share of first-try answers needed, in [0, 1]. */
  threshold: number;
  /** Number of most recent answers considered. */
  window: number;
}

/** Unlock rule for every lesson path. Change here to retune gating. */
export const GATE: Gate = { threshold: 0.8, window: 20 };

export function lessonScore(history: boolean[], gate: Gate = GATE) {
  const recent = history.slice(-gate.window);
  return { answered: recent.length, correct: recent.filter(Boolean).length };
}

export function lessonPassed(history: boolean[], gate: Gate = GATE): boolean {
  const { answered, correct } = lessonScore(history, gate);
  return answered >= gate.window && correct / answered >= gate.threshold;
}

/** Records a first-try result for a lesson and marks it passed at the gate. */
export function recordLessonResult(
  progress: Progress,
  lessonId: string,
  firstTry: boolean,
  gate: Gate = GATE,
): Progress {
  const history = [...(progress.lessonHistory[lessonId] ?? []), firstTry].slice(-gate.window);
  const passed =
    progress.passed.includes(lessonId) || !lessonPassed(history, gate)
      ? progress.passed
      : [...progress.passed, lessonId];
  return { ...progress, lessonHistory: { ...progress.lessonHistory, [lessonId]: history }, passed };
}

/** A lesson is open if it is first in its path or the one before it was passed. */
export function isUnlocked(progress: Progress, path: Lesson[], lessonId: string): boolean {
  const i = path.findIndex((l) => l.id === lessonId);
  if (i < 0) return false;
  return i === 0 || progress.passed.includes(path[i - 1]!.id);
}
