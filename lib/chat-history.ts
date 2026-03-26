/**
 * Chat history persistence using browser localStorage/cache.
 * No database - all data stays in the browser.
 */

/** Persisted message parts (text + optional file attachments for UI restore). */
export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  parts?: Array<
    | { type: "text"; text?: string }
    | { type: "file"; url: string; mediaType: string; filename?: string }
    | { type: string; [key: string]: unknown }
  >;
  createdAt?: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  resumeData?: unknown;
}

const CHAT_HISTORY_STORE = "chat-assistant-history-store";
const MAX_SESSIONS = 50;

export function getChatSessions(): ChatSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CHAT_HISTORY_STORE);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveChatSession(session: ChatSession): void {
  if (typeof window === "undefined") return;
  try {
    const sessions = getChatSessions();
    const filtered = sessions.filter((s) => s.id !== session.id);
    const updated = [
      { ...session, updatedAt: Date.now() },
      ...filtered,
    ].slice(0, MAX_SESSIONS);
    localStorage.setItem(CHAT_HISTORY_STORE, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save chat session:", e);
  }
}

export function getChatSession(id: string): ChatSession | null {
  return getChatSessions().find((s) => s.id === id) ?? null;
}

export function deleteChatSession(id: string): void {
  if (typeof window === "undefined") return;
  const sessions = getChatSessions().filter((s) => s.id !== id);
  localStorage.setItem(CHAT_HISTORY_STORE, JSON.stringify(sessions));
}

export function exportChatHistoryAsJson(
  currentMessages?: Array<{ id: string; role: string; content?: string; parts?: Array<{ type: string; text?: string }>; createdAt?: number }>
): string {
  const sessions = getChatSessions();
  const toExport = sessions;
  if (currentMessages && currentMessages.length > 0) {
    const currentSession: ChatSession = {
      id: "current",
      title: "Current chat",
      messages: currentMessages.map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant" | "system",
        content: m.content ?? (m.parts?.find((p) => p.type === "text") as { text?: string })?.text ?? "",
        parts: m.parts,
        createdAt: m.createdAt ?? Date.now(),
      })),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    return JSON.stringify([currentSession, ...sessions.filter((s) => s.id !== "current")], null, 2);
  }
  return JSON.stringify(toExport, null, 2);
}

export function importChatHistoryFromJson(json: string): ChatSession[] {
  try {
    const parsed = JSON.parse(json);
    const sessions = Array.isArray(parsed) ? parsed : [];
    if (typeof window !== "undefined") {
      localStorage.setItem(CHAT_HISTORY_STORE, JSON.stringify(sessions));
    }
    return sessions;
  } catch {
    return [];
  }
}

export function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

export function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

const CURRENT_SESSION_STORE = "chat-assistant-current-session-store";

export function getCurrentSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CURRENT_SESSION_STORE);
}

export function setCurrentSessionId(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CURRENT_SESSION_STORE, id);
}

/** Derive a short title from the first user message */
export function getSessionTitle(
  messages: Array<{ role: string; content?: string; parts?: Array<{ type: string; text?: string }> }>,
  fallback = "New chat"
): string {
  const firstUser = messages.find((m) => m.role === "user");
  const text =
    firstUser?.content ??
    (firstUser?.parts?.find((p) => p.type === "text") as { text?: string } | undefined)?.text ??
    "";
  const trimmed = String(text || "").trim().slice(0, 40);
  return trimmed ? (trimmed.length >= 40 ? `${trimmed}…` : trimmed) : fallback;
}
