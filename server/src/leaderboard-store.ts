import { DatabaseSync } from 'node:sqlite';
import type { LeaderboardEntry } from '@harmony/shared';

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
      CREATE INDEX IF NOT EXISTS scores_uuid ON scores (uuid);
      CREATE INDEX IF NOT EXISTS scores_rank ON scores (score DESC, id);
    `);
  }

  /**
   * Adds a score (a repeated runId is ignored) and gives every entry of the
   * uuid the submitted name. Returns the place on the board.
   */
  add(entry: { uuid: string; runId: string; name: string; score: number }, createdAt: Date): { rank: number } {
    this.db.exec('BEGIN');
    try {
      this.rename(entry.uuid, entry.name);
      this.db
        .prepare('INSERT OR IGNORE INTO scores (run_id, uuid, name, score, created_at) VALUES (?, ?, ?, ?, ?)')
        .run(entry.runId, entry.uuid, entry.name, entry.score, createdAt.toISOString());
      const row = this.db.prepare('SELECT score, id FROM scores WHERE run_id = ?').get(entry.runId) as {
        score: number;
        id: number;
      };
      const better = this.db
        .prepare('SELECT COUNT(*) AS n FROM scores WHERE score > ? OR (score = ? AND id < ?)')
        .get(row.score, row.score, row.id) as { n: number };
      this.db.exec('COMMIT');
      return { rank: better.n + 1 };
    } catch (e) {
      this.db.exec('ROLLBACK');
      throw e;
    }
  }

  /** Renames all entries of the uuid; returns how many changed. */
  rename(uuid: string, name: string): number {
    return Number(this.db.prepare('UPDATE scores SET name = ? WHERE uuid = ? AND name != ?').run(name, uuid, name).changes);
  }

  /** Best scores first; earlier entries win ties. */
  list(limit: number): LeaderboardEntry[] {
    const rows = this.db
      .prepare('SELECT name, score, created_at FROM scores ORDER BY score DESC, id ASC LIMIT ?')
      .all(limit) as { name: string; score: number; created_at: string }[];
    return rows.map((r) => ({ name: r.name, score: r.score, createdAt: r.created_at }));
  }

  ping(): void {
    this.db.prepare('SELECT 1').get();
  }

  close(): void {
    this.db.close();
  }
}
