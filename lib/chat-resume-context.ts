import type { UIMessage } from "ai";
import type { ResumeData } from "@/lib/types";
import { mergeAssistantResumeIntoCurrent } from "@/lib/extract-resume-json";
import { getTextContent } from "@/lib/message-utils";
import { mergeResumeDataWithDefault, sanitizeResumeData } from "@/lib/sanitize-resume-data";

/** Drop the trailing assistant message while it is still streaming (avoids partial JSON merges). */
export function messagesForResumeContext(messages: UIMessage[]): UIMessage[] {
  const last = messages.at(-1);
  if (!last || last.role !== "assistant") return messages;
  const parts = last.parts;
  if (!parts?.length) return messages;
  const streaming = parts.some((p) => {
    if (p.type === "text" || p.type === "reasoning") {
      return (p as { state?: string }).state === "streaming";
    }
    return false;
  });
  return streaming ? messages.slice(0, -1) : messages;
}

/**
 * Build the resume snapshot sent to /api/chat: localStorage (or defaults) merged with
 * every assistant message in order so the model always sees the latest CV from the thread,
 * even before the user clicks “merge” or edits the main editor.
 */
export function buildResumeDataForChatRequest(messages: UIMessage[], stored: unknown): ResumeData {
  let rolling = mergeResumeDataWithDefault(stored ?? undefined);
  for (const m of messages) {
    if (m.role !== "assistant") continue;
    const text = getTextContent(m) ?? "";
    if (!text.trim()) continue;
    const { merged } = mergeAssistantResumeIntoCurrent(rolling, text);
    if (merged) rolling = merged;
  }
  return sanitizeResumeData(rolling);
}
