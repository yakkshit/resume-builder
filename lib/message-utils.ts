import type { UIMessage } from "ai";

/**
 * Extract plain text content from a UIMessage (AI SDK v5/v6 use parts array; fallback for legacy content).
 */
export function getTextContent(message: UIMessage): string {
  if (message.parts && message.parts.length > 0) {
    return message.parts
      .filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("");
  }
  const m = message as { content?: string };
  return typeof m.content === "string" ? m.content : "";
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
