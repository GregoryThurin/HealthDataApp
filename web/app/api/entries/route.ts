import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { parseEntry } from "@/lib/parse-entry";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const transcript = typeof body.transcript === "string" ? body.transcript.trim() : null;

  if (!transcript) {
    return NextResponse.json({ error: "transcript is required" }, { status: 400 });
  }

  const recorded_at = new Date().toISOString();
  const id = crypto.randomUUID();

  await db.execute({
    sql: "INSERT INTO entries (id, transcript, recorded_at) VALUES (?, ?, ?)",
    args: [id, transcript, recorded_at],
  });

  let parsed = false;
  try {
    const events = await parseEntry(transcript, recorded_at);
    for (const e of events) {
      await db.execute({
        sql: `INSERT INTO structured_events (id, entry_id, occurred_at, description, type, circumstances, tags)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          crypto.randomUUID(),
          id,
          e.occurred_at ?? recorded_at,
          e.description,
          e.type,
          e.circumstances ?? null,
          JSON.stringify(e.tags),
        ],
      });
    }
    parsed = true;
  } catch (err) {
    console.error("Parsing failed:", err);
  }

  return NextResponse.json({ id, transcript, recorded_at, parsed }, { status: 201 });
}

export async function GET() {
  const entriesResult = await db.execute(
    "SELECT id, transcript, recorded_at FROM entries ORDER BY recorded_at DESC"
  );

  const eventsResult = await db.execute(
    "SELECT * FROM structured_events ORDER BY occurred_at ASC"
  );

  const eventsByEntry: Record<string, any[]> = {};
  for (const row of eventsResult.rows) {
    const entryId = row.entry_id as string;
    const event = { ...row, tags: JSON.parse(row.tags as string) };
    (eventsByEntry[entryId] ??= []).push(event);
  }

  const result = entriesResult.rows.map((entry) => ({
    ...entry,
    structured_events: eventsByEntry[entry.id as string] ?? [],
  }));

  return NextResponse.json(result);
}
