import type { Language } from '@harmony/shared';
import type { AudioOut, Instrument } from './instrument.ts';
import { createSynth, type Timbre } from './synth.ts';
import { createSampler, type SampleSet } from './sampler.ts';

export interface InstrumentEntry {
  id: string;
  name: Record<Language, string>;
  /** Sampled instruments list their files; without samples the synth is used. */
  samples?: SampleSet;
  /** Sound of the synthesised voice (only used without samples). */
  timbre?: Timbre;
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
      notes: [65, 67, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79],
      release: 0.15,
    },
  },
  {
    id: 'guitar',
    name: { de: 'Gitarre', en: 'Guitar' },
    samples: {
      baseUrl: 'samples/guitar-classical',
      notes: [40, 43, 45, 48, 52, 55, 58, 61, 64, 67, 70, 73, 76, 79, 82, 84],
      release: 0.5,
    },
  },
  {
    id: 'accordion',
    name: { de: 'Akkordeon', en: 'Accordion' },
    samples: {
      baseUrl: 'samples/accordion',
      notes: [47, 50, 54, 55, 57, 59, 60, 62, 64, 66, 67, 69, 71, 72, 74, 76, 79],
      release: 0.15,
    },
  },
  { id: 'guitar-synth', name: { de: 'Gitarre (Synth)', en: 'Guitar (synth)' }, timbre: 'guitar' },
  { id: 'accordion-synth', name: { de: 'Akkordeon (Synth)', en: 'Accordion (synth)' }, timbre: 'accordion' },
  { id: 'organ', name: { de: 'Orgel', en: 'Organ' }, timbre: 'organ' },
  { id: 'strings', name: { de: 'Streicher', en: 'Strings' }, timbre: 'strings' },
  { id: 'flute', name: { de: 'Flöte', en: 'Flute' }, timbre: 'flute' },
];

export const DEFAULT_INSTRUMENT = 'synth';

export function findInstrument(id: string): InstrumentEntry {
  return INSTRUMENTS.find((i) => i.id === id) ?? INSTRUMENTS.find((i) => i.id === DEFAULT_INSTRUMENT)!;
}

export function createInstrument(entry: InstrumentEntry, out: AudioOut): Instrument {
  return entry.samples ? createSampler(out, entry.samples) : createSynth(out, entry.timbre);
}
