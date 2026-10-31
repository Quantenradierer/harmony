import { serve } from '@hono/node-server';
import { createApp } from './app.ts';

const port = Number(process.env.PORT ?? 3000);
const staticDir = process.env.STATIC_DIR ?? '../web/dist';

const app = createApp({ staticDir });

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Harmony Trainer listening on port ${info.port}`);
});
