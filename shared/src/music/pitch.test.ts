import { describe, expect, it } from 'vitest';
import { midiToFrequency, pitchClass, midiFromPitchClass } from './pitch.ts';

describe('pitch maths', () => {
  it('maps A4 (69) to 440 Hz', () => {
    expect(midiToFrequency(69)).toBeCloseTo(440);
  });

  it('maps C4 (60) to middle C', () => {
    expect(midiToFrequency(60)).toBeCloseTo(261.626, 2);
  });

  it('doubles the frequency per octave', () => {
    expect(midiToFrequency(72) / midiToFrequency(60)).toBeCloseTo(2);
  });

  it('gets the pitch class of a midi note', () => {
    expect(pitchClass(60)).toBe(0);
    expect(pitchClass(67)).toBe(7);
    expect(pitchClass(59)).toBe(11);
  });

  it('builds a midi note from pitch class and octave', () => {
    expect(midiFromPitchClass(0, 4)).toBe(60);
    expect(midiFromPitchClass(7, 4)).toBe(67);
    expect(midiFromPitchClass(11, 2)).toBe(47);
  });
});
