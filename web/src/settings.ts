import type { Language, ModuleId, Playback, Register } from '@harmony/shared';

export type Theme = 'sunny' | 'calm' | 'night';
export const THEMES: Theme[] = ['sunny', 'calm', 'night'];

/** Browser chrome color per theme. */
export const THEME_COLORS: Record<Theme, string> = { sunny: '#d9602b', calm: '#3b5bdb', night: '#1d1723' };

export interface Reminder {
  enabled: boolean;
  /** Local time, HH:MM. */
  time: string;
  /** Weekdays as Date#getDay numbers (0 = Sunday). */
  days: number[];
}

export interface Settings {
  language: Language;
  theme: Theme;
  /** Play the anchor tone (C4) before each question. */
  referencePitch: boolean;
  registers: Record<ModuleId, Register>;
  /** How harmonic intervals and chords are played. */
  playback: Playback;
  /** Id from the instrument registry. */
  instrument: string;
  /** Lock each lesson until the one before it was passed. */
  lessonGating: boolean;
  reminder: Reminder;
}

export function defaultSettings(): Settings {
  return {
    language: 'de',
    theme: 'night',
    referencePitch: false,
    registers: { notes: 'medium', intervals: 'medium', chords: 'medium' },
    playback: 'together',
    instrument: 'piano',
    lessonGating: false,
    reminder: { enabled: false, time: '13:30', days: [0, 1, 2, 3, 4, 5, 6] },
  };
}
