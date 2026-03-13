import type { UIMessage } from "ai";

function getTextFromPart(part: unknown): string {
  if (!part || typeof part !== "object") return "";
  const p = part as Record<string, unknown>;
  if (typeof p.text === "string") return p.text;
  if (typeof p.content === "string") return p.content;
  if (typeof p.delta === "string") return p.delta;
  return "";
}

/**
 * Extract plain text content from a UIMessage (AI SDK v5/v6 use parts array; fallback for legacy content).
 * Handles: parts with type "text", legacy content string, content array (OpenAI format).
 */
export function getTextContent(message: UIMessage | undefined | null): string {
  if (!message) return "";

  // 1) AI SDK v5/v6: parts array with type "text"
  if (message.parts && Array.isArray(message.parts) && message.parts.length > 0) {
    const fromParts = message.parts
      .filter((p) => p && typeof p === "object" && (p as { type?: string }).type === "text")
      .map((p) => getTextFromPart(p))
      .join("");
    if (fromParts) return fromParts;
  }

  // 2) Legacy: content as string
  const m = message as { content?: string | Array<{ type?: string; text?: string; content?: string }> };
  if (typeof m.content === "string") return m.content;

  // 3) OpenAI-style: content as array of parts
  if (Array.isArray(m.content)) {
    return m.content
      .map((c) => (typeof c === "object" && c && ("text" in c ? c.text : "content" in c ? c.content : "")) ?? "")
      .filter(Boolean)
      .join("");
  }

  return "";
}

/**
 * Extract reasoning/thinking content from a UIMessage (for Cedz and other models that stream thinking).
 */
export function getReasoningContent(message: UIMessage | undefined | null): string {
  if (!message?.parts || !Array.isArray(message.parts) || message.parts.length === 0) return ""
  return message.parts
    .filter((p): p is { type: "reasoning"; text: string } => p.type === "reasoning")
    .map((p) => p.text)
    .join("")
}
