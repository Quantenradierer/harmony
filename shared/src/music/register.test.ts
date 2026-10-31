import { describe, expect, it } from 'vitest';
import { registerOctave } from './register.ts';

describe('registers', () => {
  it('maps fixed registers to octaves 3, 4, 5', () => {
    expect(registerOctave('low', () => 0)).toBe(3);
    expect(registerOctave('medium', () => 0)).toBe(4);
    expect(registerOctave('high', () => 0)).toBe(5);
  });

  it('picks any fixed register at random', () => {
    expect(registerOctave('random', () => 0)).toBe(3);
    expect(registerOctave('random', () => 0.5)).toBe(4);
    expect(registerOctave('random', () => 0.99)).toBe(5);
  });
});
