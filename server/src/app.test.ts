import { describe, expect, it } from 'vitest';
import { createApp } from './app.ts';
import { FeedbackStore } from './feedback-store.ts';

describe('server app', () => {
  it('answers the health check using the shared package', async () => {
    const res = await createApp().request('/api/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, app: 'Harmony Trainer' });
  });

  it('reports unhealthy when the database is unusable', async () => {
    const feedback = new FeedbackStore(':memory:');
    const app = createApp({ feedback });
    expect((await app.request('/api/health')).status).toBe(200);
    feedback.close();
    expect((await app.request('/api/health')).status).toBe(503);
  });
});
