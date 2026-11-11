import { writable, type Readable } from 'svelte/store';
import {
  answerRound,
  createRound,
  scoreAnswer,
  type Outcome,
  type Question,
  QUIZ_LENGTH,
  type Round,
  type Sound,
} from '@harmony/shared';
import type { Player } from '../audio/player.ts';

export interface SessionScore {
  points: number;
  streak: number;
}

export interface QuizState {
  round?: Round;
  session: SessionScore;
  /** Questions finished in this training. */
  answered: number;
  /** The last question of the training was answered. */
  finished: boolean;
  /** Points gained by the last finished round. */
  gained?: number;
}

export interface QuizResult {
  question: Question;
  outcome: Outcome;
  /** Answers picked, in order. */
  picks: string[];
  points: number;
  /** Points of the running session after this question. */
  sessionPoints: number;
}

export interface QuizDeps {
  nextQuestion: () => Question;
  player: Player;
  /** Anchor tone to play before each new question, if enabled. */
  reference?: () => Sound | undefined;
  /** Called once per finished question, e.g. to persist progress. */
  onResult?: (result: QuizResult) => void;
  /** Questions per training; defaults to QUIZ_LENGTH. */
  length?: number;
  /** Called once when the last question of a training is answered. */
  onFinish?: (result: { points: number }) => void;
}

const START: QuizState = { session: { points: 0, streak: 0 }, answered: 0, finished: false };

/** Drives the quiz loop: new question, play, answer, replay, score. */
export class QuizController {
  private store = writable<QuizState>(START);
  readonly state: Readable<QuizState> = this.store;
  private current: QuizState = START;

  constructor(private deps: QuizDeps) {}

  private update(patch: Partial<QuizState>) {
    this.current = { ...this.current, ...patch };
    this.store.set(this.current);
  }

  /** Starts a fresh training with a new score. */
  async restart(): Promise<void> {
    this.current = START;
    this.store.set(START);
    await this.next();
  }

  async next(): Promise<void> {
    if (this.current.finished) return;
    const round = createRound(this.deps.nextQuestion());
    this.update({ round, gained: undefined });
    const reference = this.deps.reference?.();
    await this.deps.player.play(...(reference ? [reference] : []), round.question.sound);
  }

  async replayReference(): Promise<void> {
    const reference = this.deps.reference?.();
    if (reference) await this.deps.player.play(reference);
  }

  /** Replays are free: they never affect the score. */
  async replay(): Promise<void> {
    const round = this.current.round;
    if (!round) return;
    await this.deps.player.play(round.question.sound);
  }

  answer(choice: string): void {
    const before = this.current.round;
    if (!before || before.done) return;
    const round = answerRound(before, choice);
    if (!round.done || !round.outcome) {
      this.update({ round });
      return;
    }
    const { points, streak } = scoreAnswer(this.current.session.streak, round.outcome);
    const answered = this.current.answered + 1;
    const finished = answered >= (this.deps.length ?? QUIZ_LENGTH);
    this.update({
      round,
      gained: points,
      session: { points: this.current.session.points + points, streak },
      answered,
      finished,
    });
    this.deps.onResult?.({
      question: round.question,
      outcome: round.outcome,
      picks: round.picks,
      points,
      sessionPoints: this.current.session.points,
    });
    if (finished) this.deps.onFinish?.({ points: this.current.session.points });
  }
}
