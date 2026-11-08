import { midiToFrequency } from '@harmony/shared';
import type { AudioOut, Instrument } from './instrument.ts';

/** Synthesised sound; none of them needs files. */
export type Timbre = 'soft' | 'guitar' | 'accordion' | 'organ' | 'strings' | 'flute';

interface Partial {
  type: OscillatorType;
  ratio: number;
  level: number;
  /** Detune in cents. */
  detune?: number;
}

interface Voice {
  partials: Partial[];
  attack: number;
  /** Gain reached after the attack decay, relative to the peak. */
  sustain: number;
  decay: number;
  release: number;
  /** Low-pass cutoff as a multiple of the note frequency (undefined = no filter). */
  cutoff?: number;
  /** Cutoff multiple the filter starts at before closing to `cutoff`. */
  cutoffStart?: number;
}

const VOICES: Record<Timbre, Voice> = {
  soft: {
    partials: [
      { type: 'triangle', ratio: 1, level: 0.25 },
      { type: 'sine', ratio: 2, level: 0.06 },
    ],
    attack: 0.015,
    sustain: 0.5,
    decay: 0.3,
    release: 0.3,
  },
  // Plucked string: bright at first, fast decay, mellow tail.
  guitar: {
    partials: [
      { type: 'sawtooth', ratio: 1, level: 0.14 },
      { type: 'triangle', ratio: 2, level: 0.08 },
      { type: 'sine', ratio: 3, level: 0.03 },
    ],
    attack: 0.004,
    sustain: 0.12,
    decay: 0.9,
    release: 0.25,
    cutoff: 3,
    cutoffStart: 14,
  },
  // Free reeds: two slightly detuned reed waves, slow swell, steady sustain.
  accordion: {
    partials: [
      { type: 'sawtooth', ratio: 1, level: 0.09, detune: -7 },
      { type: 'sawtooth', ratio: 1, level: 0.09, detune: 7 },
      { type: 'square', ratio: 2, level: 0.03 },
    ],
    attack: 0.06,
    sustain: 0.9,
    decay: 0.2,
    release: 0.12,
    cutoff: 5,
  },
  // Drawbar organ: flat, full sustain as long as the note is held.
  organ: {
    partials: [
      { type: 'sine', ratio: 1, level: 0.14 },
      { type: 'sine', ratio: 2, level: 0.1 },
      { type: 'sine', ratio: 3, level: 0.05 },
      { type: 'sine', ratio: 4, level: 0.03 },
    ],
    attack: 0.02,
    sustain: 1,
    decay: 0.05,
    release: 0.1,
  },
  // Bowed strings: detuned saws, slow swell, soft filter, long release.
  strings: {
    partials: [
      { type: 'sawtooth', ratio: 1, level: 0.07, detune: -9 },
      { type: 'sawtooth', ratio: 1, level: 0.07 },
      { type: 'sawtooth', ratio: 1, level: 0.07, detune: 9 },
    ],
    attack: 0.18,
    sustain: 0.85,
    decay: 0.4,
    release: 0.4,
    cutoff: 4,
  },
  // Flute: nearly pure tone with a little breath of the octave.
  flute: {
    partials: [
      { type: 'sine', ratio: 1, level: 0.24 },
      { type: 'sine', ratio: 2, level: 0.04 },
      { type: 'triangle', ratio: 3, level: 0.01 },
    ],
    attack: 0.07,
    sustain: 0.9,
    decay: 0.15,
    release: 0.15,
  },
};

export function createSynth(out: AudioOut, timbre: Timbre = 'soft'): Instrument {
  const voices = new Set<{ stop(): void }>();
  const v = VOICES[timbre];

  return {
    async load() {},

    play(midi, when, duration) {
      const { context } = out;
      const freq = midiToFrequency(midi);
      const gain = context.createGain();
      let sink: AudioNode = gain;
      const nodes: AudioNode[] = [gain];

      if (v.cutoff !== undefined) {
        const filter = context.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(freq * (v.cutoffStart ?? v.cutoff), when);
        filter.frequency.exponentialRampToValueAtTime(freq * v.cutoff, when + v.decay);
        filter.connect(gain);
        sink = filter;
        nodes.push(filter);
      }
      gain.connect(out.destination);

      const oscs = v.partials.map(({ type, ratio, level, detune }) => {
        const osc = context.createOscillator();
        const g = context.createGain();
        osc.type = type;
        osc.frequency.value = freq * ratio;
        if (detune) osc.detune.value = detune;
        g.gain.value = level;
        osc.connect(g).connect(sink);
        return osc;
      });

      const end = when + duration;
      gain.gain.setValueAtTime(0, when);
      gain.gain.linearRampToValueAtTime(1, when + v.attack);
      gain.gain.exponentialRampToValueAtTime(v.sustain, when + v.attack + v.decay);
      gain.gain.setValueAtTime(v.sustain, Math.max(end, when + v.attack + v.decay));
      gain.gain.exponentialRampToValueAtTime(0.0001, Math.max(end, when + v.attack + v.decay) + v.release);

      const voice = {
        stop() {
          const now = context.currentTime;
          gain.gain.cancelScheduledValues(now);
          gain.gain.setTargetAtTime(0, now, 0.02);
          oscs.forEach((o) => o.stop(now + 0.1));
        },
      };
      const stopAt = Math.max(end, when + v.attack + v.decay) + v.release + 0.05;
      oscs.forEach((o) => {
        o.start(when);
        o.stop(stopAt);
      });
      oscs[0]!.onended = () => {
        voices.delete(voice);
        nodes.forEach((n) => n.disconnect());
      };
      voices.add(voice);
    },

    stop() {
      voices.forEach((x) => x.stop());
      voices.clear();
    },
  };
}
