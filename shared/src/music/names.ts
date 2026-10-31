import { pitchClass, type PitchClass } from './pitch.ts';

export type Language = 'de' | 'en';
export const LANGUAGES: Language[] = ['de', 'en'];

const NAMES: Record<Language, string[]> = {
  de: ['C', 'Cis/Des', 'D', 'Dis/Es', 'E', 'F', 'Fis/Ges', 'G', 'Gis/As', 'A', 'Ais/B', 'H'],
  en: ['C', 'C♯/D♭', 'D', 'D♯/E♭', 'E', 'F', 'F♯/G♭', 'G', 'G♯/A♭', 'A', 'A♯/B♭', 'B'],
};

/** Note name in the given language; black keys carry both spellings. */
export function noteName(pc: PitchClass, lang: Language): string {
  return NAMES[lang][pitchClass(pc)]!;
}
