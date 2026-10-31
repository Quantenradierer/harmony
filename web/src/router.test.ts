import { describe, expect, it, vi } from 'vitest';

vi.stubGlobal('location', { hash: '' });
vi.stubGlobal('addEventListener', () => {});
vi.stubGlobal('removeEventListener', () => {});
const { parseRoute, href } = await import('./router.ts');

describe('router', () => {
  it('round-trips every route', () => {
    for (const r of [
      { name: 'home' },
      { name: 'lesson', id: 'notes-2' },
      { name: 'practice', module: 'chords' },
      { name: 'settings' },
      { name: 'feedback' },
    ] as const) {
      expect(parseRoute(href(r))).toEqual(r);
    }
  });

  it('falls back to home for unknown paths', () => {
    expect(parseRoute('#/nope')).toEqual({ name: 'home' });
    expect(parseRoute('#/practice/scales')).toEqual({ name: 'home' });
  });
});
