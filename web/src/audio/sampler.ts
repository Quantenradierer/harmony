import type { AudioOut, Instrument } from './instrument.ts';

export interface SampleSet {
  /** URL folder holding `<midi>.mp3` files. */
  baseUrl: string;
  /** MIDI notes that have a sample file. */
  notes: number[];
  /** Release time in seconds after a note's duration ends. */
  release?: number;
}

/** Sample whose pitch is closest to `midi`; ties go to the lower sample. */
export function nearestSample(notes: number[], midi: number): number {
  return notes.reduce((best, n) => (Math.abs(n - midi) < Math.abs(best - midi) ? n : best));
}

/**
 * Plays decoded samples, pitch-shifting from the nearest recorded note.
 * Samples are fetched on the first load() only (lazy), then kept in memory;
 * the service worker caches the files for offline use.
 */
export function createSampler(out: AudioOut, set: SampleSet): Instrument {
  const buffers = new Map<number, AudioBuffer>();
  const voices = new Set<{ src: AudioBufferSourceNode; gain: GainNode }>();
  let loading: Promise<void> | undefined;

  async function fetchSample(midi: number) {
    const res = await fetch(`${set.baseUrl}/${midi}.mp3`);
    if (!res.ok) throw new Error(`sample ${midi}: HTTP ${res.status}`);
    buffers.set(midi, await out.context.decodeAudioData(await res.arrayBuffer()));
  }

  return {
    load() {
      loading ??= Promise.all(set.notes.map(fetchSample)).then(
        () => undefined,
        (err: unknown) => {
          loading = undefined; // allow a retry, e.g. after coming back online
          throw err;
        },
      );
      return loading;
    },

    play(midi, when, duration) {
      const { context } = out;
      const sample = nearestSample(set.notes, midi);
      const buffer = buffers.get(sample);
      if (!buffer) return;
      const src = context.createBufferSource();
      src.buffer = buffer;
      src.playbackRate.value = 2 ** ((midi - sample) / 12);
      const gain = context.createGain();
      src.connect(gain).connect(out.destination);
      const release = set.release ?? 0.4;
      const end = when + duration;
      gain.gain.setValueAtTime(0.9, when);
      gain.gain.setValueAtTime(0.9, end);
      gain.gain.exponentialRampToValueAtTime(0.0001, end + release);
      src.start(when);
      src.stop(end + release + 0.05);
      const voice = { src, gain };
      voices.add(voice);
      src.onended = () => {
        voices.delete(voice);
        gain.disconnect();
      };
    },

    stop() {
      const now = out.context.currentTime;
      voices.forEach(({ src, gain }) => {
        gain.gain.cancelScheduledValues(now);
        gain.gain.setTargetAtTime(0, now, 0.02);
        src.stop(now + 0.1);
      });
      voices.clear();
    },
  };
}
