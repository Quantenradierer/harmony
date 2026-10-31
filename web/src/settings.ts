import type { Language, ModuleId, Playback, Register } from '@harmony/shared';

export interface Settings {
  language: Language;
  /** Play the anchor tone (C4) before each question. */
  referencePitch: boolean;
  registers: Record<ModuleId, Register>;
  /** How harmonic intervals and chords are played. */
  playback: Playback;
}

export function defaultSettings(): Settings {
  return {
    language: 'de',
    referencePitch: false,
    registers: { notes: 'medium', intervals: 'medium', chords: 'medium' },
    playback: 'together',
  };
}
