import { createClient } from "@libsql/client";

const db = createClient({
  url: process.env.TURSO_DB_URL!,
  authToken: process.env.TURSO_DB_TOKEN!,
});

export async function initDb() {
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS entries (
      id TEXT PRIMARY KEY,
      transcript TEXT NOT NULL,
      recorded_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS structured_events (
      id TEXT PRIMARY KEY,
      entry_id TEXT REFERENCES entries(id) ON DELETE SET NULL,
      occurred_at TEXT NOT NULL,
      description TEXT NOT NULL,
      type TEXT NOT NULL,
      circumstances TEXT,
      tags TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

export default db;
