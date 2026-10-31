import type { AudioOut } from './instrument.ts';

let out: AudioOut | undefined;

/**
 * Lazily creates the AudioContext. Must first be called from a user gesture,
 * as browsers keep audio suspended until then.
 */
export function getAudioOut(): AudioOut {
  if (!out) {
    const context = new AudioContext();
    const master = context.createGain();
    master.gain.value = 0.8;
    master.connect(context.destination);
    out = { context, destination: master };
  }
  if (out.context.state === 'suspended') void out.context.resume();
  return out;
}
