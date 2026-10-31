import type { Language } from '@harmony/shared';

export interface Settings {
  language: Language;
}

export function defaultSettings(): Settings {
  return { language: 'de' };
}
