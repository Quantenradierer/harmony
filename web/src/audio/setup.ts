import { get, writable } from 'svelte/store';
import { Player } from './player.ts';
import { getAudioOut } from './context.ts';
import { createInstrument, findInstrument } from './registry.ts';
import type { Instrument } from './instrument.ts';
import { settings } from '../stores.ts';

/** Loading state of the current instrument, for the UI. */
export const instrumentStatus = writable<'ready' | 'loading' | 'error'>('ready');

const created = new Map<string, Instrument>();
const loaded = new Set<string>();

/** The current instrument from settings, created and loaded on first use. */
async function currentInstrument(): Promise<Instrument> {
  const entry = findInstrument(get(settings).instrument);
  let instrument = created.get(entry.id);
  if (!instrument) {
    instrument = createInstrument(entry, getAudioOut());
    created.set(entry.id, instrument);
  }
  if (!loaded.has(entry.id)) {
    instrumentStatus.set('loading');
    try {
      await instrument.load();
      loaded.add(entry.id);
    } catch (err) {
      instrumentStatus.set('error');
      throw err;
    }
  }
  instrumentStatus.set('ready');
  return instrument;
}

/** The app-wide player, using real Web Audio. */
export const player = new Player({
  instrument: currentInstrument,
  now: () => getAudioOut().context.currentTime,
});
