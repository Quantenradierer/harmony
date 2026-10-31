import { writable, type Readable } from 'svelte/store';
import { answerRound, createRound, type Question, type Round } from '@harmony/shared';
import type { Player } from '../audio/player.ts';

export interface QuizState {
  round?: Round;
}

export interface QuizDeps {
  nextQuestion: () => Question;
  player: Player;
}

/** Drives the quiz loop: new question, play, answer, replay. */
export class QuizController {
  private store = writable<QuizState>({});
  readonly state: Readable<QuizState> = this.store;
  private round?: Round;

  constructor(private deps: QuizDeps) {}

  async next(): Promise<void> {
    this.round = createRound(this.deps.nextQuestion());
    this.store.set({ round: this.round });
    await this.replay();
  }

  async replay(): Promise<void> {
    if (!this.round) return;
    await this.deps.player.play(this.round.question.sound);
  }

  answer(choice: string): void {
    if (!this.round) return;
    this.round = answerRound(this.round, choice);
    this.store.set({ round: this.round });
  }
}
