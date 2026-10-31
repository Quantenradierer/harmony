import type { Instrument } from './instrument.ts';

/** Test double: records what would have been played. */
export class FakeInstrument implements Instrument {
  played: { midi: number; when: number; duration: number }[] = [];
  stops = 0;
  loads = 0;

  async load() {
    this.loads++;
  }

  play(midi: number, when: number, duration: number) {
    this.played.push({ midi, when, duration });
  }

  stop() {
    this.stops++;
  }
}
