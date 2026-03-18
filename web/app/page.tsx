"use client";

import { useEffect, useRef, useState } from "react";

type StructuredEvent = {
  id: string;
  occurred_at: string;
  description: string;
  type: string;
  circumstances: string | null;
  tags: string[];
};

type Entry = {
  id: string;
  transcript: string;
  recorded_at: string;
  structured_events: StructuredEvent[];
};

const TYPE_COLORS: Record<string, string> = {
  symptom:     "bg-red-100 text-red-700",
  feeling:     "bg-purple-100 text-purple-700",
  action:      "bg-blue-100 text-blue-700",
  medication:  "bg-yellow-100 text-yellow-700",
  sleep:       "bg-indigo-100 text-indigo-700",
  measurement: "bg-green-100 text-green-700",
  context:     "bg-gray-100 text-gray-700",
};

export default function Home() {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => {
    fetchEntries();
  }, []);

  async function fetchEntries() {
    const res = await fetch("/api/entries");
    if (res.ok) setEntries(await res.json());
  }

  function startRecording() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser. Use Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "fr-FR";

    recognition.onresult = (event: any) => {
      let full = "";
      for (let i = 0; i < event.results.length; i++) {
        full += event.results[i][0].transcript;
      }
      setTranscript(full);
    };

    recognition.onerror = (event: any) => {
      setError(`Recognition error: ${event.error}`);
      setRecording(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setRecording(true);
    setError(null);
  }

  function stopRecording() {
    recognitionRef.current?.stop();
    setRecording(false);
  }

  async function saveEntry() {
    if (!transcript.trim()) return;
    setSaving(true);
    const res = await fetch("/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript }),
    });
    setSaving(false);
    if (res.ok) {
      const data = await res.json();
      setTranscript("");
      fetchEntries();
      if (!data.parsed) setError("Entry saved but parsing failed — use 'Parse all' to retry.");
    } else {
      const data = await res.json();
      setError(data.error ?? "Failed to save entry");
    }
  }

  async function parseAll() {
    setParsing(true);
    setParseProgress(null);
    let failed = 0;
    for (let i = 0; i < entries.length; i++) {
      setParseProgress(`Parsing ${i + 1} / ${entries.length}…`);
      const res = await fetch(`/api/entries/${entries[i].id}/parse`, { method: "POST" });
      if (!res.ok) failed++;
    }
    setParsing(false);
    setParseProgress(failed > 0 ? `Done with ${failed} error(s) — check console` : `Done — ${entries.length} entries parsed.`);
    fetchEntries();
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-12 space-y-10">
      <h1 className="text-2xl font-semibold">Health Log</h1>

      <section className="space-y-4">
        <div className="flex gap-3">
          {!recording ? (
            <button
              onClick={startRecording}
              className="px-5 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            >
              Record
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="px-5 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition animate-pulse"
            >
              Stop
            </button>
          )}
          <button
            onClick={saveEntry}
            disabled={!transcript.trim() || saving}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <textarea
          className="w-full h-32 p-3 border rounded-lg bg-transparent resize-none text-sm"
          placeholder="Transcription will appear here. You can also type or edit."
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
        />
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-medium">Past entries</h2>
          <button
            onClick={parseAll}
            disabled={parsing || entries.length === 0}
            className="px-4 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-40"
          >
            {parsing ? parseProgress : "Parse all"}
          </button>
          {!parsing && parseProgress && (
            <span className="text-sm text-gray-400">{parseProgress}</span>
          )}
        </div>

        {entries.length === 0 && (
          <p className="text-sm text-gray-400">No entries yet.</p>
        )}

        <div className="space-y-4">
          {entries.map((entry) => (
            <div key={entry.id} className="grid grid-cols-2 gap-4 border rounded-xl p-4">
              <div className="space-y-1">
                <p className="text-xs text-gray-400">{new Date(entry.recorded_at).toLocaleString()}</p>
                <p className="text-sm">{entry.transcript}</p>
              </div>

              <div className="space-y-2 border-l pl-4">
                {entry.structured_events.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">Not parsed yet</p>
                ) : (
                  entry.structured_events.map((e) => (
                    <div key={e.id} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[e.type] ?? "bg-gray-100 text-gray-600"}`}>
                          {e.type}
                        </span>
                        <span className="text-xs text-gray-400">{new Date(e.occurred_at).toLocaleString()}</span>
                      </div>
                      <p className="text-sm">{e.description}</p>
                      {e.circumstances && (
                        <p className="text-xs text-gray-400 italic">{e.circumstances}</p>
                      )}
                      {e.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {e.tags.map((tag) => (
                            <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
