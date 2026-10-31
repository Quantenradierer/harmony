import { describe, expect, it } from 'vitest';
import { APP_NAME } from './index.ts';

describe('shared', () => {
  it('exports the app name', () => {
    expect(APP_NAME).toBe('Harmony Trainer');
  });
});
