import Database from "better-sqlite3";
import { randomUUID } from "crypto";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, "../health.db"));

const entries = [
  { transcript: "woke up with a minor headache",                                         recorded_at: "2026-03-16T09:00:00+01:00" },
  { transcript: "drunk third Monster of the day",                                         recorded_at: "2026-03-16T16:30:00+01:00" },
  { transcript: "forgot to say that yesterday evening when going to sleep, my leg hurt",  recorded_at: "2026-03-16T19:00:00+01:00" },
  { transcript: "my eyes are dry",                                                         recorded_at: "2026-03-17T10:00:00+01:00" },
  { transcript: "j'ai mal au dos. non merci, pas la peine",                               recorded_at: "2026-03-17T14:00:00+01:00" },
];

const insert = db.prepare("INSERT INTO entries (id, transcript, recorded_at) VALUES (?, ?, ?)");

for (const e of entries) {
  insert.run(randomUUID(), e.transcript, e.recorded_at);
}

console.log(`Inserted ${entries.length} entries.`);
