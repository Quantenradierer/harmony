import { describe, expect, it } from 'vitest';
import { APP_NAME } from '@harmony/shared';

describe('web', () => {
  it('can import the shared package', () => {
    expect(APP_NAME).toBe('Harmony Trainer');
  });
});
