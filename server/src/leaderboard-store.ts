import { DatabaseSync } from 'node:sqlite';
import type { LeaderboardEntry, ScoreCreated } from '@harmony/shared';

/** Per player and board only the best score counts. */
const BEST_PER_BOARD = `
  SELECT uuid, board, MAX(score) AS best FROM scores WHERE board != '' GROUP BY uuid, board
`;

/** Leaderboard entries in SQLite. Pass ':memory:' for tests. */
export class LeaderboardStore {
  private db: DatabaseSync;

  constructor(path: string) {
    this.db = new DatabaseSync(path);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        run_id TEXT NOT NULL UNIQUE,
        uuid TEXT NOT NULL,
        name TEXT NOT NULL,
        score INTEGER NOT NULL,
        created_at TEXT NOT NULL
      );
    `);
    // Entries from before boards existed keep board '' and count nowhere.
    const columns = this.db.prepare('PRAGMA table_info(scores)').all() as { name: string }[];
    if (!columns.some((c) => c.name === 'board')) {
      this.db.exec("ALTER TABLE scores ADD COLUMN board TEXT NOT NULL DEFAULT ''");
    }
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS scores_uuid ON scores (uuid);
      CREATE INDEX IF NOT EXISTS scores_board ON scores (board, uuid);
    `);
  }

  /**
   * Adds a score (a repeated runId is ignored) and gives every entry of the
   * uuid the submitted name.
   */
  add(
    entry: { uuid: string; runId: string; board: string; name: string; score: number },
    createdAt: Date,
  ): ScoreCreated {
    this.db.exec('BEGIN');
    try {
      this.rename(entry.uuid, entry.name);
      this.db
        .prepare(
          'INSERT OR IGNORE INTO scores (run_id, uuid, board, name, score, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        )
        .run(entry.runId, entry.uuid, entry.board, entry.name, entry.score, createdAt.toISOString());
      const best = this.db
        .prepare('SELECT MAX(score) AS best FROM scores WHERE uuid = ? AND board = ?')
        .get(entry.uuid, entry.board) as { best: number };
      const ahead = this.db
        .prepare(
          `SELECT COUNT(*) AS n FROM (SELECT MAX(score) AS m FROM scores WHERE board = ? GROUP BY uuid) WHERE m > ?`,
        )
        .get(entry.board, best.best) as { n: number };
      const total = this.db
        .prepare(`SELECT SUM(best) AS total FROM (${BEST_PER_BOARD}) WHERE uuid = ?`)
        .get(entry.uuid) as { total: number };
      const totalAhead = this.db
        .prepare(`SELECT COUNT(*) AS n FROM (SELECT SUM(best) AS t FROM (${BEST_PER_BOARD}) GROUP BY uuid) WHERE t > ?`)
        .get(total.total) as { n: number };
      this.db.exec('COMMIT');
      return { rank: ahead.n + 1, total: total.total, totalRank: totalAhead.n + 1 };
    } catch (e) {
      this.db.exec('ROLLBACK');
      throw e;
    }
  }

  /** Renames all entries of the uuid; returns how many changed. */
  rename(uuid: string, name: string): number {
    return Number(this.db.prepare('UPDATE scores SET name = ? WHERE uuid = ? AND name != ?').run(name, uuid, name).changes);
  }

  /** Best score per player on one board, best first; earlier players win ties. */
  listBoard(board: string, limit: number): LeaderboardEntry[] {
    return this.db
      .prepare(
        `SELECT MAX(name) AS name, MAX(score) AS score FROM scores WHERE board = ?
         GROUP BY uuid ORDER BY score DESC, MIN(id) ASC LIMIT ?`,
      )
      .all(board, limit) as unknown as LeaderboardEntry[];
  }

  /** Global board: per player the sum of their best scores on all boards. */
  listTotal(limit: number): LeaderboardEntry[] {
    return this.db
      .prepare(
        `SELECT (SELECT name FROM scores s WHERE s.uuid = b.uuid ORDER BY id DESC LIMIT 1) AS name,
                SUM(best) AS score
         FROM (${BEST_PER_BOARD}) b GROUP BY uuid ORDER BY score DESC, MIN(uuid) ASC LIMIT ?`,
      )
      .all(limit) as unknown as LeaderboardEntry[];
  }

  ping(): void {
    this.db.prepare('SELECT 1').get();
  }

  close(): void {
    this.db.close();
  }
}
