import type { Sound } from '@harmony/shared';
import type { Instrument } from './instrument.ts';

/** Small lead time so the first note is not clipped. */
const LEAD = 0.05;
/** Silence between consecutive sounds, e.g. reference pitch and question. */
export const GAP = 0.4;

export interface PlayerDeps {
  instrument: () => Promise<Instrument>;
  /** Current audio-clock time in seconds. */
  now: () => number;
}

/** Plays Sounds through whichever instrument is current. */
export class Player {
  constructor(private deps: PlayerDeps) {}

  /** Plays the sounds one after another with a short gap; resolves with the total length. */
  async play(...sounds: Sound[]): Promise<number> {
    const instrument = await this.deps.instrument();
    await instrument.load();
    instrument.stop();
    let t = this.deps.now() + LEAD;
    const start = t;
    for (const sound of sounds) {
      for (const e of sound.events) instrument.play(e.midi, t + e.time, e.duration);
      t += soundLength(sound) + GAP;
    }
    return t - GAP - start;
  }
}

export function soundLength(sound: Sound): number {
  return Math.max(0, ...sound.events.map((e) => e.time + e.duration));
}
