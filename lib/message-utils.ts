import type { UIMessage } from "ai";

/**
 * Extract plain text content from a UIMessage (AI SDK v5 uses parts array).
 */
export function getTextContent(message: UIMessage): string {
  if (!message.parts || message.parts.length === 0) return "";
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}
