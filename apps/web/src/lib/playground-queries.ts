export type PlaygroundNote = {
  id: string;
  text: string;
  timestamp: number;
};

export type QueryRunResult =
  | { ok: true; action: "insert"; note: PlaygroundNote }
  | { ok: true; action: "find"; notes: PlaygroundNote[] }
  | { ok: false; error: string };

const DEFAULT_INSERT_TEXT = "Hello from the homepage playground!";

export const DEFAULT_PLAYGROUND_QUERY = `await db("notes").insert({
  text: "${DEFAULT_INSERT_TEXT}",
});`;

function extractInsertPayload(source: string): Record<string, unknown> | null {
  const textMatch = source.match(/text\s*:\s*(["'`])((?:\\.|(?!\1).)*)\1/);
  if (textMatch) {
    return { text: textMatch[2].replace(/\\"/g, '"') };
  }

  const insertMatch = source.match(/\.insert\s*\(\s*(\{[\s\S]*\})\s*\)/);
  if (!insertMatch) return null;

  try {
    const normalized = insertMatch[1]
      .replace(/(\w+)\s*:/g, '"$1":')
      .replace(/'/g, '"')
      .replace(/,\s*}/g, "}");
    return JSON.parse(normalized) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function runPlaygroundQuery(source: string, notes: PlaygroundNote[]): QueryRunResult {
  const trimmed = source.trim();
  if (!trimmed) {
    return { ok: false, error: "Write a query before running." };
  }

  if (/\.find\s*\(/.test(trimmed) || /\bfind\s*\(/.test(trimmed)) {
    return { ok: true, action: "find", notes };
  }

  const payload = extractInsertPayload(trimmed);
  if (!payload) {
    return {
      ok: false,
      error: 'Use insert({ text: "..." }) or db("notes").insert({ text: "..." }).',
    };
  }

  const textValue = payload.text ?? payload.message ?? payload.title;
  if (typeof textValue !== "string" || !textValue.trim()) {
    return { ok: false, error: 'Insert payloads need a string "text" field.' };
  }

  const note: PlaygroundNote = {
    id: Math.random().toString(36).slice(2, 9),
    text: textValue.trim(),
    timestamp: Date.now(),
  };

  return { ok: true, action: "insert", note };
}

export function mergePlaygroundNotes(
  clientA: PlaygroundNote[],
  clientB: PlaygroundNote[]
): PlaygroundNote[] {
  const merged = new Map<string, PlaygroundNote>();
  for (const note of [...clientA, ...clientB]) {
    const existing = merged.get(note.id);
    if (!existing || note.timestamp > existing.timestamp) {
      merged.set(note.id, { ...note });
    }
  }
  return Array.from(merged.values());
}
