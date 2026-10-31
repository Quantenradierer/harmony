import { INTERVAL_IDS, semitones, type IntervalDirection, type IntervalId } from '../music/intervals.ts';
import { midiFromPitchClass } from '../music/pitch.ts';
import { registerOctave } from '../music/register.ts';
import { harmonic, melodic } from './playback.ts';
import { pick, type GenerateOptions, type Question, type Rng } from './types.ts';

export interface IntervalsSpec {
  module: 'intervals';
  intervals: IntervalId[];
  direction: IntervalDirection;
}

export const intervalCategory = (id: IntervalId) => `interval:${id}`;

export function generateIntervalQuestion(
  spec: IntervalsSpec,
  rng: Rng,
  options: GenerateOptions = {},
): Question {
  const ids = INTERVAL_IDS.filter((id) => spec.intervals.includes(id));
  const id = pick(ids, rng);
  const root = midiFromPitchClass(Math.floor(rng() * 12), registerOctave(options.register ?? 'medium', rng));
  const top = root + semitones(id);
  const sound =
    spec.direction === 'ascending'
      ? melodic([root, top])
      : spec.direction === 'descending'
        ? melodic([top, root])
        : harmonic([root, top], options.playback ?? 'together');
  return {
    module: 'intervals',
    category: intervalCategory(id),
    prompt: { kind: 'choice' },
    sound,
    choices: ids.map(intervalCategory),
    answer: intervalCategory(id),
  };
}
