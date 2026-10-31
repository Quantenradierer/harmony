/** A pitch class: 0 = C, 1 = C♯/D♭, …, 11 = B. */
export type PitchClass = number;

/** Frequency in Hz of a MIDI note number (equal temperament, A4 = 440 Hz). */
export function midiToFrequency(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

export function pitchClass(midi: number): PitchClass {
  return ((midi % 12) + 12) % 12;
}

/** MIDI number of a pitch class in a scientific-pitch octave (C4 = 60). */
export function midiFromPitchClass(pc: PitchClass, octave: number): number {
  return (octave + 1) * 12 + pc;
}
