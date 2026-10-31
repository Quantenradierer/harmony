/**
 * Everything that makes sound implements Instrument. Quiz code only talks to
 * this interface, so tests can swap in a fake.
 */
export interface Instrument {
  /** Prepare the instrument (e.g. fetch samples). Safe to call repeatedly. */
  load(): Promise<void>;
  /** Schedule a note at audio-clock time `when` (seconds). */
  play(midi: number, when: number, duration: number): void;
  /** Silence everything that is sounding or scheduled. */
  stop(): void;
}

/** Audio context access shared by all instruments. */
export interface AudioOut {
  readonly context: AudioContext;
  readonly destination: AudioNode;
}
