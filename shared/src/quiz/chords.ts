import { CHORD_IDS, chordNotes, type ChordId } from '../music/chords.ts';
import { midiFromPitchClass } from '../music/pitch.ts';
import { registerOctave } from '../music/register.ts';
import { harmonic } from './playback.ts';
import { pick, pickCategory, type GenerateOptions, type Question, type Rng } from './types.ts';

export interface ChordsSpec {
  module: 'chords';
  chords: ChordId[];
  /** Inversions to draw from; default root position only. */
  inversions?: number[];
  /** Yes/no asks "Is this <target>?"; choice asks to name the chord. */
  format: 'choice' | 'yesno';
  /** Required for yes/no: the chord quality asked about. */
  target?: ChordId;
}

export const chordCategory = (id: ChordId) => `chord:${id}`;
export const YES = 'yes';
export const NO = 'no';

export function generateChordQuestion(spec: ChordsSpec, rng: Rng, options: GenerateOptions = {}): Question {
  const ids = CHORD_IDS.filter((id) => spec.chords.includes(id));
  let id: ChordId;
  if (spec.format === 'yesno') {
    const target = spec.target;
    if (!target || !ids.includes(target)) throw new Error('yes/no chord spec needs a target among its chords');
    const others = ids.filter((c) => c !== target);
    // Half the time the target, otherwise one of the others.
    id = rng() < 0.5 || others.length === 0 ? target : pick(others, rng);
  } else {
    id = pickCategory(ids, chordCategory, rng, options.category);
  }
  const inversion = pick(spec.inversions ?? [0], rng);
  const root = midiFromPitchClass(Math.floor(rng() * 12), registerOctave(options.register ?? 'medium', rng));
  const sound = harmonic(chordNotes(id, root, inversion), options.playback ?? 'together');

  if (spec.format === 'yesno') {
    const target = spec.target!;
    return {
      module: 'chords',
      category: chordCategory(id),
      prompt: { kind: 'yesno', category: chordCategory(target) },
      sound,
      choices: [YES, NO],
      answer: id === target ? YES : NO,
    };
  }
  return {
    module: 'chords',
    category: chordCategory(id),
    prompt: { kind: 'choice' },
    sound,
    choices: ids.map(chordCategory),
    answer: chordCategory(id),
  };
}
