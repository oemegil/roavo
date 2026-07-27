/**
 * Controlled JSON extraction for provider text that may include fences or prose.
 */
export function extractJsonText(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error("Empty AI output");
  }

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return trimmed;
  }

  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence?.[1]) {
    return fence[1].trim();
  }

  const objectStart = trimmed.indexOf("{");
  const arrayStart = trimmed.indexOf("[");
  let start = -1;
  if (objectStart >= 0 && arrayStart >= 0) {
    start = Math.min(objectStart, arrayStart);
  } else {
    start = Math.max(objectStart, arrayStart);
  }
  if (start < 0) {
    throw new Error("No JSON object found in AI output");
  }

  const candidate = trimmed.slice(start);
  const endObject = candidate.lastIndexOf("}");
  const endArray = candidate.lastIndexOf("]");
  const end = Math.max(endObject, endArray);
  if (end < 0) {
    throw new Error("Incomplete JSON in AI output");
  }
  return candidate.slice(0, end + 1);
}

/** Close truncated JSON (missing final braces/brackets) and strip trailing commas. */
export function repairTruncatedJson(text: string): string {
  let s = text.trim();
  s = s.replace(/,\s*([}\]])/g, "$1");

  const closers: string[] = [];
  let inString = false;
  let escape = false;

  for (let i = 0; i < s.length; i += 1) {
    const ch = s[i]!;
    if (inString) {
      if (escape) {
        escape = false;
      } else if (ch === "\\") {
        escape = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "{") closers.push("}");
    else if (ch === "[") closers.push("]");
    else if (ch === "}" || ch === "]") {
      const expected = closers[closers.length - 1];
      if (expected === ch) closers.pop();
    }
  }

  if (inString) {
    s += '"';
  }

  while (closers.length > 0) {
    s += closers.pop();
  }

  return s;
}

export function parseJsonSafe(raw: string): unknown {
  const text = extractJsonText(raw);
  try {
    return JSON.parse(text) as unknown;
  } catch (firstError) {
    try {
      return JSON.parse(repairTruncatedJson(text)) as unknown;
    } catch {
      throw firstError;
    }
  }
}
