import { timingSafeEqual } from 'node:crypto';
import { Hono, type Context } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { serveStatic } from '@hono/node-server/serve-static';
import { getConnInfo } from '@hono/node-server/conninfo';
import {
  APP_NAME,
  BOARD_PARAM,
  FEEDBACK_PATH,
  LEADERBOARD_PATH,
  LEADERBOARD_SIZE,
  PLAYER_PATH,
  SCORES_PATH,
  isBoard,
  validateFeedback,
  validatePlayer,
  validateScore,
  type ApiError,
  type ScoreCreated,
} from '@harmony/shared';
import type { FeedbackStore } from './feedback-store.ts';
import type { LeaderboardStore } from './leaderboard-store.ts';
import { RateLimiter } from './rate-limit.ts';

/** Assumed limits; see docs/open-assumptions.md. */
export const FEEDBACK_RATE_LIMIT = { posts: 5, windowMs: 60_000 };
export const SCORE_RATE_LIMIT = { posts: 20, windowMs: 60_000 };

export interface AppOptions {
  /** Directory holding the built PWA; omit to serve the API only. */
  staticDir?: string;
  feedback?: FeedbackStore;
  leaderboard?: LeaderboardStore;
  /** Bearer token for reading feedback; reading is disabled when empty. */
  feedbackToken?: string;
  now?: () => Date;
}

/**
 * Client IP. Behind the reverse proxy the socket address is the proxy, so the
 * last X-Forwarded-For entry (the one the proxy appended) is used.
 */
function clientIp(c: Context): string {
  const forwarded = c.req.header('x-forwarded-for');
  if (forwarded) return forwarded.split(',').at(-1)!.trim();
  try {
    return getConnInfo(c).remote.address ?? 'unknown';
  } catch {
    return 'unknown';
  }
}

function tokenMatches(header: string | undefined, token: string | undefined): boolean {
  if (!token || !header?.startsWith('Bearer ')) return false;
  const given = Buffer.from(header.slice('Bearer '.length));
  const expected = Buffer.from(token);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export function createApp(options: AppOptions = {}): Hono {
  const app = new Hono();
  const now = options.now ?? (() => new Date());
  const limiter = new RateLimiter(FEEDBACK_RATE_LIMIT.posts, FEEDBACK_RATE_LIMIT.windowMs, () => now().getTime());
  const scoreLimiter = new RateLimiter(SCORE_RATE_LIMIT.posts, SCORE_RATE_LIMIT.windowMs, () => now().getTime());
  const error = (c: Context, status: 400 | 401 | 413 | 429, code: ApiError['error']) =>
    c.json<ApiError>({ error: code }, status);

  const feedback = options.feedback;
  const leaderboard = options.leaderboard;

  app.get('/api/health', (c) => {
    try {
      feedback?.ping();
      leaderboard?.ping();
    } catch {
      return c.json({ ok: false, app: APP_NAME }, 503);
    }
    return c.json({ ok: true, app: APP_NAME });
  });

  if (feedback) {
    app.post(
      FEEDBACK_PATH,
      bodyLimit({ maxSize: 32 * 1024, onError: (c) => error(c, 413, 'too-long') }),
      async (c) => {
        if (!limiter.allow(clientIp(c))) return error(c, 429, 'rate-limited');
        const body: unknown = await c.req.json().catch(() => null);
        const result = validateFeedback(body);
        if ('error' in result) return error(c, 400, result.error);
        return c.json(feedback.add(result.text, now()), 201);
      },
    );

    app.get(FEEDBACK_PATH, (c) => {
      if (!tokenMatches(c.req.header('authorization'), options.feedbackToken)) {
        return error(c, 401, 'unauthorized');
      }
      return c.json(feedback.list());
    });
  }

  if (leaderboard) {
    const small = bodyLimit({ maxSize: 1024, onError: (c) => error(c, 413, 'too-long') });

    app.post(SCORES_PATH, small, async (c) => {
      if (!scoreLimiter.allow(clientIp(c))) return error(c, 429, 'rate-limited');
      const result = validateScore(await c.req.json().catch(() => null));
      if ('error' in result) return error(c, 400, result.error);
      return c.json<ScoreCreated>(leaderboard.add(result, now()), 201);
    });

    app.put(PLAYER_PATH, small, async (c) => {
      if (!scoreLimiter.allow(clientIp(c))) return error(c, 429, 'rate-limited');
      const result = validatePlayer(await c.req.json().catch(() => null));
      if ('error' in result) return error(c, 400, result.error);
      leaderboard.rename(result.uuid, result.name);
      return c.body(null, 204);
    });

    app.get(LEADERBOARD_PATH, (c) => {
      const board = c.req.query(BOARD_PARAM);
      if (board === undefined) return c.json(leaderboard.listTotal(LEADERBOARD_SIZE));
      if (!isBoard(board)) return error(c, 400, 'invalid');
      return c.json(leaderboard.listBoard(board, LEADERBOARD_SIZE));
    });
  }

  app.all('/api/*', (c) => c.json({ error: 'not-found' }, 404));

  if (options.staticDir) {
    const root = options.staticDir;
    app.use('/*', serveStatic({ root }));
    // Single-page app: unknown non-API paths fall back to index.html.
    app.get('*', serveStatic({ root, path: 'index.html' }));
  }

  return app;
}
