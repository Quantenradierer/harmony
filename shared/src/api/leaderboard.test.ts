import { describe, expect, it } from 'vitest';
import { MAX_SCORE, validateName, validatePlayer, validateScore } from './leaderboard.ts';

const UUID = '3b241101-e2bb-4255-8caf-4136c566a962';
const RUN = '9b2c6f3e-6a53-4b7e-9a0e-0c1b3e8f2d41';

describe('leaderboard validation', () => {
  it('knows the best possible score', () => {
    expect(MAX_SCORE).toBe(285);
  });

  it('accepts a valid score and trims the name', () => {
    expect(validateScore({ uuid: UUID, runId: RUN, name: '  Ada ', score: 120 })).toEqual({
      uuid: UUID,
      runId: RUN,
      name: 'Ada',
      score: 120,
    });
  });

  it('rejects impossible scores and bad ids', () => {
    const ok = { uuid: UUID, runId: RUN, name: 'Ada', score: 1 };
    expect(validateScore({ ...ok, score: MAX_SCORE + 1 })).toEqual({ error: 'invalid' });
    expect(validateScore({ ...ok, score: -1 })).toEqual({ error: 'invalid' });
    expect(validateScore({ ...ok, score: 1.5 })).toEqual({ error: 'invalid' });
    expect(validateScore({ ...ok, uuid: 'nope' })).toEqual({ error: 'invalid' });
    expect(validateScore({ ...ok, runId: undefined })).toEqual({ error: 'invalid' });
    expect(validateScore(null)).toEqual({ error: 'invalid' });
  });

  it('checks names', () => {
    expect(validateName('')).toEqual({ error: 'empty' });
    expect(validateName('a'.repeat(31))).toEqual({ error: 'too-long' });
    expect(validateName('a'.repeat(30))).toEqual({ name: 'a'.repeat(30) });
    expect(validateName('a\nb')).toEqual({ error: 'invalid' });
    expect(validateName(5)).toEqual({ error: 'invalid' });
  });

  it('validates a rename', () => {
    expect(validatePlayer({ uuid: UUID, name: 'Bo' })).toEqual({ uuid: UUID, name: 'Bo' });
    expect(validatePlayer({ uuid: 'x', name: 'Bo' })).toEqual({ error: 'invalid' });
  });
});
