import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { parseEntry } from "@/lib/parse-entry";
import { auth } from "@/auth";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  const { id } = await params;

  const result = await db.execute({
    sql: "SELECT * FROM entries WHERE id = ? AND user_id = ?",
    args: [id, userId],
  });

  const entry = result.rows[0];
  if (!entry) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  await db.execute({
    sql: "DELETE FROM structured_events WHERE entry_id = ?",
    args: [id],
  });

  let events;
  try {
    events = await parseEntry(entry.transcript as string, entry.recorded_at as string);
  } catch (err: any) {
    console.error("parseEntry failed:", err);
    return NextResponse.json({ error: err.message ?? "Parsing failed" }, { status: 500 });
  }

  for (const e of events) {
    await db.execute({
      sql: `INSERT INTO structured_events (id, entry_id, occurred_at, description, type, circumstances, tags)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        crypto.randomUUID(),
        id,
        e.occurred_at ?? (entry.recorded_at as string),
        e.description,
        e.type,
        e.circumstances ?? null,
        JSON.stringify(e.tags),
      ],
    });
  }

  const eventsResult = await db.execute({
    sql: "SELECT * FROM structured_events WHERE entry_id = ?",
    args: [id],
  });

  return NextResponse.json(eventsResult.rows, { status: 201 });
}
