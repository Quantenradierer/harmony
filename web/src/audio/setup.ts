import { Player } from './player.ts';
import { createSynth } from './synth.ts';
import { getAudioOut } from './context.ts';
import type { Instrument } from './instrument.ts';

let synth: Instrument | undefined;

/** The app-wide player, using real Web Audio. */
export const player = new Player({
  instrument: async () => (synth ??= createSynth(getAudioOut())),
  now: () => getAudioOut().context.currentTime,
});
