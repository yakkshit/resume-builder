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

/** Concatenate reasoning parts (AI SDK v6 `ReasoningUIPart`). */
export function getReasoningContent(message: UIMessage): string {
  if (!message.parts?.length) return "";
  return message.parts
    .filter((p): p is { type: "reasoning"; text: string } => p.type === "reasoning" && typeof (p as { text?: string }).text === "string")
    .map((p) => (p as { text: string }).text)
    .join("");
}

/** True while a reasoning part is still streaming. */
export function isReasoningStreaming(message: UIMessage): boolean {
  if (!message.parts?.length) return false;
  return message.parts.some(
    (p) => p.type === "reasoning" && (p as { state?: string }).state === "streaming",
  );
}
