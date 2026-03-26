/**
 * Detect JSON blobs that look like chat component envelopes (CV, etc.).
 * Avoids treating arbitrary `{` in prose as JSON.
 */
export function isLikelyJsonEnvelope(s: string): boolean {
  const t = s.trim();
  return /^\{[\s\n]*"(?:component|componentType|resumeData|type)"/.test(t);
}

/**
 * While streaming, hide incomplete JSON tails so raw `{"resumeData":...` does not flash on screen.
 * When the JSON completes, `JSON.parse` succeeds and the full text is returned for normal parsing.
 */
export function stripIncompleteJsonTail(text: string, isStreaming: boolean): string {
  if (!isStreaming || !text) return text;
  const idx = text.indexOf("{");
  if (idx < 0) return text;
  const candidate = text.slice(idx).trim();
  if (!isLikelyJsonEnvelope(candidate)) return text;
  try {
    JSON.parse(candidate);
    return text;
  } catch {
    return text.slice(0, idx).trimEnd();
  }
}
