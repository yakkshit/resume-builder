"use client";

import { useCallback, useEffect, useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────────

export interface AttachedFile {
  name: string;
  size: number;
  type: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  componentType?: string;
  componentData?: Record<string, unknown>;
  timestamp: number;
  attachedFiles?: AttachedFile[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface ChatSettings {
  apiKey: string;
  model: string;
  contextWindow: string; // context text/instructions passed with each request
}

// ── Constants ──────────────────────────────────────────────────────────────

const SESSIONS_STORAGE_ID = "ai-chat-sessions";
const SETTINGS_STORAGE_ID = "ai-chat-settings";

export const AVAILABLE_MODELS = [
  // Google Gemini
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash", provider: "Google" },
  { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro", provider: "Google" },
  { value: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite", provider: "Google" },
  { value: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro", provider: "Google" },
  { value: "gemini-3-flash-preview", label: "Gemini 3 Flash", provider: "Google" },
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash", provider: "Google" },
  // OpenAI
  { value: "gpt-4o", label: "GPT-4o", provider: "OpenAI" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini", provider: "OpenAI" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo", provider: "OpenAI" },
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo", provider: "OpenAI" },
  // Anthropic
  { value: "claude-3-5-sonnet", label: "Claude 3.5 Sonnet", provider: "Anthropic" },
  { value: "claude-3-5-haiku", label: "Claude 3.5 Haiku", provider: "Anthropic" },
  // DeepSeek
  { value: "deepseek-chat", label: "DeepSeek Chat", provider: "DeepSeek" },
  // Groq
  { value: "llama-3.1-8b-instant", label: "Llama 3.1 8B", provider: "Groq" },
  { value: "llama-3.1-70b-versatile", label: "Llama 3.1 70B", provider: "Groq" },
  // Mistral
  { value: "mistral-large-latest", label: "Mistral Large", provider: "Mistral" },
  { value: "mistral-small-latest", label: "Mistral Small", provider: "Mistral" },
];

const DEFAULT_SETTINGS: ChatSettings = {
  apiKey: "",
  model: "gemini-2.5-flash",
  contextWindow: "",
};

// ── Helpers ────────────────────────────────────────────────────────────────

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota exceeded, ignore */
  }
}

// ── Hooks ──────────────────────────────────────────────────────────────────

/** Manages all chat sessions (persistence + CRUD). */
export function useChatSessions() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentId, setCurrentId] = useState<string>("");

  // Hydrate from localStorage
  useEffect(() => {
    const stored = loadFromStorage<ChatSession[]>(SESSIONS_STORAGE_ID, []);
    if (stored.length > 0) {
      setSessions(stored);
      setCurrentId(stored[0].id);
    } else {
      const fresh = createSession();
      setSessions([fresh]);
      setCurrentId(fresh.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist on change
  useEffect(() => {
    if (sessions.length > 0) saveToStorage(SESSIONS_STORAGE_ID, sessions);
  }, [sessions]);

  const currentSession = sessions.find((s) => s.id === currentId) ?? null;

  const createSession = useCallback((): ChatSession => {
    return {
      id: generateId(),
      title: "New Chat",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }, []);

  const addSession = useCallback(() => {
    const s = {
      id: generateId(),
      title: "New Chat",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setSessions((prev) => [s, ...prev]);
    setCurrentId(s.id);
    return s;
  }, []);

  const deleteSession = useCallback(
    (id: string) => {
      setSessions((prev) => {
        const next = prev.filter((s) => s.id !== id);
        if (id === currentId && next.length > 0) setCurrentId(next[0].id);
        else if (next.length === 0) {
          const fresh = {
            id: generateId(),
            title: "New Chat",
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          setCurrentId(fresh.id);
          return [fresh];
        }
        return next;
      });
    },
    [currentId]
  );

  const appendMessage = useCallback(
    (sessionId: string, msg: ChatMessage) => {
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== sessionId) return s;
          const messages = [...s.messages, msg];
          return {
            ...s,
            messages,
            title: messages.find((m) => m.role === "user")?.content.slice(0, 60) ?? s.title,
            updatedAt: Date.now(),
          };
        })
      );
    },
    []
  );

  const exportSession = useCallback(
    (id: string): string => {
      const s = sessions.find((sess) => sess.id === id);
      return JSON.stringify(s ?? {}, null, 2);
    },
    [sessions]
  );

  const importSession = useCallback((json: string) => {
    const s = JSON.parse(json) as ChatSession;
    s.id = generateId(); // avoid collision
    setSessions((prev) => [s, ...prev]);
    setCurrentId(s.id);
  }, []);

  return {
    sessions,
    currentId,
    setCurrentId,
    currentSession,
    addSession,
    deleteSession,
    appendMessage,
    exportSession,
    importSession,
  };
}

/** Manages API settings (model, key, context window). */
export function useChatSettings() {
  const [settings, setSettings] = useState<ChatSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const stored = loadFromStorage<ChatSettings>(SETTINGS_STORAGE_ID, DEFAULT_SETTINGS);
    // API key should NOT persist in browser storage.
    setSettings({ ...stored, apiKey: "" });
  }, []);

  const updateSettings = useCallback((patch: Partial<ChatSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      // Persist everything except API key.
      const { apiKey: _apiKey, ...persistable } = next;
      saveToStorage(SETTINGS_STORAGE_ID, persistable as ChatSettings);
      return next;
    });
  }, []);

  return { settings, updateSettings };
}
