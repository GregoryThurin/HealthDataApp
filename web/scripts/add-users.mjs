import { createClient } from "@libsql/client";

const db = createClient({
  url: process.env.TURSO_DB_URL,
  authToken: process.env.TURSO_DB_TOKEN,
});

await db.executeMultiple(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT
  );

  ALTER TABLE entries ADD COLUMN user_id TEXT REFERENCES users(id);
`);

console.log("Done.");
