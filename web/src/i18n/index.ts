import { derived } from 'svelte/store';
import { noteName, type Language } from '@harmony/shared';
import { settings } from '../stores.ts';
import { de } from './de.ts';
import { en, type MessageKey, type Messages } from './en.ts';

export type { MessageKey };

export const catalogs: Record<Language, Messages> = { de, en };

export type Params = Record<string, string | number>;

export function translate(lang: Language, key: MessageKey, params: Params = {}): string {
  return catalogs[lang][key].replace(/\{(\w+)\}/g, (_, name: string) => String(params[name] ?? `{${name}}`));
}

/** Display name of an answer category such as "note:7" or "interval:P5". */
export function categoryLabel(lang: Language, category: string): string {
  const [kind, value] = category.split(':');
  if (kind === 'note') return noteName(Number(value), lang);
  return translate(lang, `${kind}.${value}` as MessageKey);
}

export const language = derived(settings, (s) => s.language);
export const t = derived(language, (lang) => (key: MessageKey, params?: Params) => translate(lang, key, params));
export const label = derived(language, (lang) => (category: string) => categoryLabel(lang, category));
