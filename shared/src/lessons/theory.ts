import type { Language } from '../music/names.ts';
import intervalTheory from './data/interval-theory.json' with { type: 'json' };

const CARDS: Record<string, Record<Language, string>> = Object.fromEntries(
  Object.entries(intervalTheory).map(([id, text]) => [`interval:${id}`, text]),
);

/** Short theory text with a mnemonic for a category, if one exists. */
export function theoryCard(category: string, lang: Language): string | undefined {
  return CARDS[category]?.[lang];
}
