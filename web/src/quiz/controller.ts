import { writable, type Readable } from 'svelte/store';
import {
  answerRound,
  createRound,
  scoreAnswer,
  type Outcome,
  type Question,
  type Round,
} from '@harmony/shared';
import type { Player } from '../audio/player.ts';

export interface SessionScore {
  points: number;
  streak: number;
}

export interface QuizState {
  round?: Round;
  session: SessionScore;
  /** Points gained by the last finished round. */
  gained?: number;
}

export interface QuizResult {
  question: Question;
  outcome: Outcome;
  points: number;
}

export interface QuizDeps {
  nextQuestion: () => Question;
  player: Player;
  /** Called once per finished question, e.g. to persist progress. */
  onResult?: (result: QuizResult) => void;
}

/** Drives the quiz loop: new question, play, answer, replay, score. */
export class QuizController {
  private store = writable<QuizState>({ session: { points: 0, streak: 0 } });
  readonly state: Readable<QuizState> = this.store;
  private current: QuizState = { session: { points: 0, streak: 0 } };

  constructor(private deps: QuizDeps) {}

  private update(patch: Partial<QuizState>) {
    this.current = { ...this.current, ...patch };
    this.store.set(this.current);
  }

  async next(): Promise<void> {
    this.update({ round: createRound(this.deps.nextQuestion()), gained: undefined });
    await this.replay();
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
    this.update({
      round,
      gained: points,
      session: { points: this.current.session.points + points, streak },
    });
    this.deps.onResult?.({ question: round.question, outcome: round.outcome, points });
  }
}
