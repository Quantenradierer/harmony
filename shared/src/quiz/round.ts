import type { Question } from './types.ts';

export type Outcome = 'first-try' | 'second-try' | 'wrong';

/** The answering state of one question. Immutable; use answerRound to advance. */
export interface Round {
  question: Question;
  picks: string[];
  done: boolean;
  outcome?: Outcome;
}

export function createRound(question: Question): Round {
  return { question, picks: [], done: false };
}

/** A second try only makes sense when more than two choices exist. */
function maxPicks(question: Question): number {
  return question.choices.length > 2 ? 2 : 1;
}

export function answerRound(round: Round, choice: string): Round {
  if (!round.question.choices.includes(choice)) {
    throw new Error(`unknown choice: ${choice}`);
  }
  if (round.done || round.picks.includes(choice)) return round;

  const picks = [...round.picks, choice];
  const correct = choice === round.question.answer;
  if (correct) {
    return { ...round, picks, done: true, outcome: picks.length === 1 ? 'first-try' : 'second-try' };
  }
  if (picks.length >= maxPicks(round.question)) {
    return { ...round, picks, done: true, outcome: 'wrong' };
  }
  return { ...round, picks };
}

/**
 * Categories the learner took the played sound for by mistake. In a choice
 * question every wrong pick; in a yes/no question a wrong "yes" means the
 * sound was taken for the asked-about category (a wrong "no" names nothing).
 */
export function mistakenFor(question: Question, picks: string[]): string[] {
  const wrong = picks.filter((p) => p !== question.answer);
  if (question.prompt.kind === 'yesno') {
    return wrong.includes('yes') ? [question.prompt.category] : [];
  }
  return wrong;
}
