import { midiToFrequency } from '@harmony/shared';
import type { AudioOut, Instrument } from './instrument.ts';

/** A soft two-oscillator synth; needs no files. */
export function createSynth(out: AudioOut): Instrument {
  const voices = new Set<{ stop(): void }>();

  return {
    async load() {},

    play(midi, when, duration) {
      const { context } = out;
      const freq = midiToFrequency(midi);
      const gain = context.createGain();
      gain.connect(out.destination);

      const oscs = [
        { type: 'triangle' as const, freq, level: 0.25 },
        { type: 'sine' as const, freq: freq * 2, level: 0.06 },
      ].map(({ type, freq, level }) => {
        const osc = context.createOscillator();
        const g = context.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        g.gain.value = level;
        osc.connect(g).connect(gain);
        return osc;
      });

      const release = 0.3;
      const end = when + duration;
      gain.gain.setValueAtTime(0, when);
      gain.gain.linearRampToValueAtTime(1, when + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.5, when + 0.3);
      gain.gain.setValueAtTime(0.5, end);
      gain.gain.exponentialRampToValueAtTime(0.0001, end + release);

      const voice = {
        stop() {
          const now = context.currentTime;
          gain.gain.cancelScheduledValues(now);
          gain.gain.setTargetAtTime(0, now, 0.02);
          oscs.forEach((o) => o.stop(now + 0.1));
        },
      };
      oscs.forEach((o) => {
        o.start(when);
        o.stop(end + release + 0.05);
      });
      oscs[0]!.onended = () => {
        voices.delete(voice);
        gain.disconnect();
      };
      voices.add(voice);
    },

    stop() {
      voices.forEach((v) => v.stop());
      voices.clear();
    },
  };
}
