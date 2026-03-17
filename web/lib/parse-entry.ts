import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const SYSTEM_PROMPT = `You are a health event parser. Given a free-form text (in French or English) describing one or more health-related events, extract each distinct event and return a JSON array.

Each event object must have:
- "occurred_at": ISO 8601 timestamp if mentioned, otherwise null
- "description": clean, neutral, third-person description of the event in English
- "type": one of: symptom, feeling, action, medication, sleep, measurement, context
- "circumstances": any relevant context or circumstance mentioned, or null
- "tags": array of lowercase keyword strings useful for filtering (e.g. ["headache", "morning", "pain"])

Rules:
- Split compound entries into separate events when clearly distinct
- If the user mentions an event from a different time than the recording (e.g. "yesterday evening"), reflect that in occurred_at if possible, otherwise note it in circumstances
- Never invent information not present in the text
- Return ONLY the JSON array, no explanation, no markdown
- If an entry seems irrelevant to any possible health related topic, add the tag "possiblyirrelevant"
- Take into account that not all that is said can be related to the entry, and do not hesitate to cut out the portion that is not, for instance if it seems like the recording goes longer than the intendeed description

Reference timestamp (when the entry was recorded): {recorded_at}`;

export type ParsedEvent = {
  occurred_at: string | null;
  description: string;
  type: "symptom" | "feeling" | "action" | "medication" | "sleep" | "measurement" | "context";
  circumstances: string | null;
  tags: string[];
};

export async function parseEntry(transcript: string, recordedAt: string): Promise<ParsedEvent[]> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = SYSTEM_PROMPT.replace("{recorded_at}", recordedAt) + "\n\nText: " + transcript;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  const json = text.startsWith("```") ? text.replace(/```[a-z]*\n?/g, "").trim() : text;

  return JSON.parse(json) as ParsedEvent[];
}
