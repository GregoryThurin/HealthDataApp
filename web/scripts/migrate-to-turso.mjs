import { createClient } from "@libsql/client";
import { randomUUID } from "crypto";

const turso = createClient({
  url: process.env.TURSO_DB_URL,
  authToken: process.env.TURSO_DB_TOKEN,
});

await turso.executeMultiple(`
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

console.log("Tables created.");

const entries = [
  { transcript: "woke up with a minor headache",                                         recorded_at: "2026-03-16T09:00:00+01:00" },
  { transcript: "drunk third Monster of the day",                                         recorded_at: "2026-03-16T16:30:00+01:00" },
  { transcript: "forgot to say that yesterday evening when going to sleep, my leg hurt",  recorded_at: "2026-03-16T19:00:00+01:00" },
  { transcript: "my eyes are dry",                                                         recorded_at: "2026-03-17T10:00:00+01:00" },
  { transcript: "j'ai mal au dos. non merci, pas la peine",                               recorded_at: "2026-03-17T14:00:00+01:00" },
];

for (const e of entries) {
  await turso.execute({
    sql: "INSERT INTO entries (id, transcript, recorded_at) VALUES (?, ?, ?)",
    args: [randomUUID(), e.transcript, e.recorded_at],
  });
}

console.log(`Inserted ${entries.length} entries.`);
