import { midiFromPitchClass, type PitchClass } from '../music/pitch.ts';
import { registerOctave } from '../music/register.ts';
import { pickCategory, type GenerateOptions, type Question, type Rng } from './types.ts';

export interface NoteQuizSpec {
  pitchClasses: PitchClass[];
}

export const NOTE_DURATION = 1.5;

export const noteId = (pc: PitchClass) => `note:${pc}`;

export function generateNoteQuestion(
  spec: NoteQuizSpec,
  rng: Rng,
  options: GenerateOptions = {},
): Question {
  const pcs = [...spec.pitchClasses].sort((a, b) => a - b);
  const pc = pickCategory(pcs, noteId, rng, options.category);
  const midi = midiFromPitchClass(pc, registerOctave(options.register ?? 'medium', rng));
  return {
    module: 'notes',
    category: noteId(pc),
    prompt: { kind: 'choice' },
    sound: { events: [{ midi, time: 0, duration: NOTE_DURATION }] },
    choices: pcs.map(noteId),
    answer: noteId(pc),
  };
}
