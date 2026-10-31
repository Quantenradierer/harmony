import { describe, expect, it } from 'vitest';
import { Player } from './player.ts';
import { FakeInstrument } from './fake.ts';

describe('player', () => {
  it('schedules every event relative to the audio clock', async () => {
    const inst = new FakeInstrument();
    const player = new Player({ instrument: async () => inst, now: () => 10 });
    const length = await player.play({
      events: [
        { midi: 60, time: 0, duration: 1 },
        { midi: 64, time: 0.5, duration: 1 },
      ],
    });
    expect(inst.loads).toBe(1);
    expect(inst.stops).toBe(1);
    expect(inst.played.map((p) => p.midi)).toEqual([60, 64]);
    expect(inst.played[1]!.when - inst.played[0]!.when).toBeCloseTo(0.5);
    expect(inst.played[0]!.when).toBeGreaterThanOrEqual(10);
    expect(length).toBeCloseTo(1.5);
  });

  it('plays several sounds back to back', async () => {
    const inst = new FakeInstrument();
    const player = new Player({ instrument: async () => inst, now: () => 0 });
    await player.play(
      { events: [{ midi: 60, time: 0, duration: 1 }] },
      { events: [{ midi: 67, time: 0, duration: 1 }] },
    );
    expect(inst.played[1]!.when - inst.played[0]!.when).toBeCloseTo(1);
  });
});
