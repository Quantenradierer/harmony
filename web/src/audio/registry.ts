import type { Language } from '@harmony/shared';
import type { AudioOut, Instrument } from './instrument.ts';
import { createSynth } from './synth.ts';
import { createSampler, type SampleSet } from './sampler.ts';

export interface InstrumentEntry {
  id: string;
  name: Record<Language, string>;
  /** Sampled instruments list their files; without samples the synth is used. */
  samples?: SampleSet;
}

const range = (from: number, to: number, step: number) =>
  Array.from({ length: Math.floor((to - from) / step) + 1 }, (_, i) => from + i * step);

/**
 * Every instrument the app offers. Adding an instrument means adding an entry
 * here (plus its sample files under public/samples and their licence).
 */
export const INSTRUMENTS: InstrumentEntry[] = [
  { id: 'synth', name: { de: 'Synthesizer', en: 'Synth' } },
  {
    id: 'piano',
    name: { de: 'Klavier', en: 'Piano' },
    samples: { baseUrl: 'samples/piano', notes: range(49, 97, 4) },
  },
  {
    id: 'harp',
    name: { de: 'Harfe', en: 'Harp' },
    samples: {
      baseUrl: 'samples/harp',
      notes: [48, 52, 55, 59, 62, 65, 69, 72, 76, 79, 83, 86, 89, 93, 98],
      release: 0.8,
    },
  },
  {
    id: 'bagpipe',
    name: { de: 'Dudelsack', en: 'Bagpipe' },
    samples: {
      baseUrl: 'samples/bagpipe',
      notes: [67, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79],
      release: 0.15,
    },
  },
];

export const DEFAULT_INSTRUMENT = 'synth';

export function findInstrument(id: string): InstrumentEntry {
  return INSTRUMENTS.find((i) => i.id === id) ?? INSTRUMENTS.find((i) => i.id === DEFAULT_INSTRUMENT)!;
}

export function createInstrument(entry: InstrumentEntry, out: AudioOut): Instrument {
  return entry.samples ? createSampler(out, entry.samples) : createSynth(out);
}
