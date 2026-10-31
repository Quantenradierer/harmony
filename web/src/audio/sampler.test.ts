import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { nearestSample } from './sampler.ts';
import { INSTRUMENTS, findInstrument } from './registry.ts';

describe('sampler', () => {
  it('picks the nearest recorded note', () => {
    expect(nearestSample([48, 52, 55], 50)).toBe(48);
    expect(nearestSample([48, 52, 55], 51)).toBe(52);
    expect(nearestSample([48, 52, 55], 90)).toBe(55);
  });
});

describe('instrument registry', () => {
  it('offers synth, piano and harp', () => {
    expect(INSTRUMENTS.map((i) => i.id)).toEqual(['synth', 'piano', 'harp']);
  });

  it('falls back to the synth for unknown ids', () => {
    expect(findInstrument('kazoo').id).toBe('synth');
  });

  it('has a sample file for every note of every sampled instrument', () => {
    for (const { samples } of INSTRUMENTS) {
      if (!samples) continue;
      for (const n of samples.notes) {
        const file = new URL(`../../public/${samples.baseUrl}/${n}.mp3`, import.meta.url);
        expect(existsSync(file), file.pathname).toBe(true);
      }
    }
  });

  it('documents the licence of every sample set', () => {
    const licence = readFileSync(new URL('../../public/samples/LICENSE.md', import.meta.url), 'utf8');
    for (const { samples } of INSTRUMENTS) {
      if (samples) expect(licence).toContain(`\`${samples.baseUrl.replace('samples/', '')}/\``);
    }
  });
});
