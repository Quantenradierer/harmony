import type { Language, ModuleId, Register } from '@harmony/shared';

export interface Settings {
  language: Language;
  /** Play the anchor tone (C4) before each question. */
  referencePitch: boolean;
  registers: Record<ModuleId, Register>;
}

export function defaultSettings(): Settings {
  return {
    language: 'de',
    referencePitch: false,
    registers: { notes: 'medium', intervals: 'medium', chords: 'medium' },
  };
}
