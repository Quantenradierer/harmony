import type { Language, ModuleId, Playback, Register } from '@harmony/shared';

export interface Settings {
  language: Language;
  /** Play the anchor tone (C4) before each question. */
  referencePitch: boolean;
  registers: Record<ModuleId, Register>;
  /** How harmonic intervals and chords are played. */
  playback: Playback;
  /** Id from the instrument registry. */
  instrument: string;
  /** Lock each lesson until the one before it was passed. */
  lessonGating: boolean;
}

export function defaultSettings(): Settings {
  return {
    language: 'de',
    referencePitch: false,
    registers: { notes: 'medium', intervals: 'medium', chords: 'medium' },
    playback: 'together',
    instrument: 'piano',
    lessonGating: false,
  };
}
