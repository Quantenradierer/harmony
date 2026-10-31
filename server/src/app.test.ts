import { describe, expect, it } from 'vitest';
import { createApp } from './app.ts';

describe('server app', () => {
  it('answers the health check using the shared package', async () => {
    const res = await createApp().request('/api/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, app: 'Harmony Trainer' });
  });
});
