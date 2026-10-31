import { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';
import { APP_NAME } from '@harmony/shared';

export interface AppOptions {
  /** Directory holding the built PWA; omit to serve the API only. */
  staticDir?: string;
}

export function createApp(options: AppOptions = {}): Hono {
  const app = new Hono();

  app.get('/api/health', (c) => c.json({ ok: true, app: APP_NAME }));

  if (options.staticDir) {
    const root = options.staticDir;
    app.use('/*', serveStatic({ root }));
    // Single-page app: unknown non-API paths fall back to index.html.
    app.get('*', serveStatic({ root, path: 'index.html' }));
  }

  return app;
}
