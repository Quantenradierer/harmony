import type { Sound } from '@harmony/shared';
import type { Instrument } from './instrument.ts';

/** Small lead time so the first note is not clipped. */
const LEAD = 0.05;

export interface PlayerDeps {
  instrument: () => Promise<Instrument>;
  /** Current audio-clock time in seconds. */
  now: () => number;
}

/** Plays Sounds through whichever instrument is current. */
export class Player {
  constructor(private deps: PlayerDeps) {}

  /** Plays the sounds one after another; resolves with the total length in seconds. */
  async play(...sounds: Sound[]): Promise<number> {
    const instrument = await this.deps.instrument();
    await instrument.load();
    instrument.stop();
    let t = this.deps.now() + LEAD;
    const start = t;
    for (const sound of sounds) {
      for (const e of sound.events) instrument.play(e.midi, t + e.time, e.duration);
      t += soundLength(sound);
    }
    return t - start;
  }
}

export function soundLength(sound: Sound): number {
  return Math.max(0, ...sound.events.map((e) => e.time + e.duration));
}
