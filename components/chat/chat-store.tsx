"use client";

import { useCallback, useEffect, useState } from "react";
import { tryLocalStorageGet, tryLocalStorageSet } from "@/lib/safe-local-storage";

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
  /** When true, assistant replies that include resume JSON are merged into stored resumeData */
  autoMergeAssistantResume: boolean;
  /** Base URL for OpenAI-compatible provider (e.g. https://api.openai.com/v1 or proxy root) */
  openAiCompatBaseUrl: string;
  /** Model id sent to the OpenAI-compatible /v1/chat/completions endpoint */
  openAiCompatModel: string;
  /** Optional Hugging Face Hub model id override (legacy HF + HF AI SDK curated picks) */
  huggingFaceCustomModel: string;
  /** Optional override for “model docs” link in Integrations (else .env NEXT_PUBLIC_MULTI_MODEL_*) */
  integrationsDocsUrlOverride: string;
  /**
   * Vercel OIDC / PAT for Sandbox “test” from the sidebar — session only, never persisted.
   * Prefer `vercel env pull` → VERCEL_OIDC_TOKEN on the server.
   */
  vercelOidcToken: string;
  /** Optional OpenAI key for server-side clip transcription (Whisper); session only, never persisted. */
  openaiTranscriptionApiKey: string;
  /** Default language for AI generation and translation UI. */
  defaultLanguage: string;
}

// ── Constants ──────────────────────────────────────────────────────────────

const SESSIONS_STORAGE_ID = "ai-chat-sessions";
const SETTINGS_STORAGE_ID = "ai-chat-settings";

export const AVAILABLE_MODELS = [
  // Google Gemini
  { value: "gemini-3.8-flash", label: "Gemini 3.8 Flash (Next Gen)", provider: "Google" },
  { value: "gemini-3.7-flash", label: "Gemini 3.7 Flash", provider: "Google" },
  { value: "gemini-3.7-pro", label: "Gemini 3.7 Pro", provider: "Google" },
  { value: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro Preview", provider: "Google" },
  { value: "gemini-3-pro-preview", label: "Gemini 3.0 Pro Preview", provider: "Google" },
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash", provider: "Google" },
  { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro", provider: "Google" },
  { value: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite", provider: "Google" },
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash", provider: "Google" },

  // OpenAI
  { value: "gpt-6-astra", label: "GPT-6 Astra (Preview)", provider: "OpenAI" },
  { value: "gpt-5.6", label: "GPT-5.6", provider: "OpenAI" },
  { value: "gpt-5.5", label: "GPT-5.5", provider: "OpenAI" },
  { value: "gpt-5.2-pro", label: "GPT-5.2 Pro", provider: "OpenAI" },
  { value: "gpt-5.2", label: "GPT-5.2", provider: "OpenAI" },
  { value: "gpt-5", label: "GPT-5", provider: "OpenAI" },
  { value: "gpt-4o", label: "GPT-4o", provider: "OpenAI" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini", provider: "OpenAI" },
  { value: "o3-mini", label: "o3 Mini", provider: "OpenAI" },
  { value: "o1", label: "o1 Reasoning", provider: "OpenAI" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo", provider: "OpenAI" },

  // Anthropic Claude
  { value: "claude-sonnet-5", label: "Claude Sonnet 5", provider: "Anthropic" },
  { value: "claude-fable-5-1", label: "Claude Fable 5.1", provider: "Anthropic" },
  { value: "claude-opus-4.8", label: "Claude Opus 4.8", provider: "Anthropic" },
  { value: "claude-sonnet-4.6", label: "Claude Sonnet 4.6", provider: "Anthropic" },
  { value: "claude-3-7-sonnet", label: "Claude 3.7 Sonnet", provider: "Anthropic" },
  { value: "claude-3-5-sonnet", label: "Claude 3.5 Sonnet", provider: "Anthropic" },
  { value: "claude-3-5-haiku", label: "Claude 3.5 Haiku", provider: "Anthropic" },

  // xAI Grok
  { value: "grok-4.6", label: "Grok 4.6", provider: "xAI" },
  { value: "grok-4.5", label: "Grok 4.5", provider: "xAI" },
  { value: "grok-4-fast-reasoning", label: "Grok 4 Fast Reasoning", provider: "xAI" },
  { value: "grok-3", label: "Grok 3", provider: "xAI" },

  // DeepSeek
  { value: "deepseek-v4-flash-vision-exp", label: "DeepSeek V4 Flash Vision", provider: "DeepSeek" },
  { value: "deepseek-v4-pro", label: "DeepSeek V4 Pro", provider: "DeepSeek" },
  { value: "deepseek-chat", label: "DeepSeek V3", provider: "DeepSeek" },
  { value: "deepseek-reasoner", label: "DeepSeek R1", provider: "DeepSeek" },

  // Moonshot AI (Kimi)
  { value: "kimi-k3", label: "Kimi K3", provider: "Moonshot AI" },
  { value: "kimi-k2.7-code", label: "Kimi K2.7 Code", provider: "Moonshot AI" },

  // Groq
  { value: "meta-llama/llama-4-scout-17b-16e-instruct", label: "Llama 4 Scout (Groq)", provider: "Groq" },
  { value: "llama-3.3-70b-versatile", label: "Llama 3.3 70B", provider: "Groq" },
  { value: "llama-3.1-8b-instant", label: "Llama 3.1 8B", provider: "Groq" },
  { value: "deepseek-r1-distill-llama-70b", label: "DeepSeek R1 (Groq)", provider: "Groq" },

  // Mistral
  { value: "pixtral-large-latest", label: "Pixtral Large", provider: "Mistral" },
  { value: "mistral-large-latest", label: "Mistral Large", provider: "Mistral" },
  { value: "magistral-medium-2506", label: "Magistral Medium", provider: "Mistral" },
  { value: "mistral-small-latest", label: "Mistral Small", provider: "Mistral" },

  // Cohere
  { value: "command-a-03-2025", label: "Command A", provider: "Cohere" },
  { value: "command-r-plus", label: "Command R+", provider: "Cohere" },

  // Local & Custom
  { value: "cedz-hr-qwen", label: "Cedz HR Qwen", provider: "FcukOff AI" },
  { value: "ollama-local", label: "Ollama (Local)", provider: "Ollama" },
  { value: "openai-compatible-aisdk", label: "OpenAI-Compatible / Custom", provider: "OpenAI Compatible" },
];

const DEFAULT_SETTINGS: ChatSettings = {
  apiKey: "",
  model: "gemini-2.5-flash",
  contextWindow: "",
  autoMergeAssistantResume: true,
  openAiCompatBaseUrl: "",
  openAiCompatModel: "gpt-4o-mini",
  huggingFaceCustomModel: "",
  integrationsDocsUrlOverride: "",
  vercelOidcToken: "",
  openaiTranscriptionApiKey: "",
  defaultLanguage: "en",
};

// ── Helpers ────────────────────────────────────────────────────────────────

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = tryLocalStorageGet(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T) {
  tryLocalStorageSet(key, JSON.stringify(value));
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
    const stored = loadFromStorage<Partial<ChatSettings>>(SETTINGS_STORAGE_ID, {});
    // Secrets must NOT persist in browser storage; merge so new keys get defaults.
    setSettings({
      ...DEFAULT_SETTINGS,
      ...stored,
      apiKey: "",
      vercelOidcToken: "",
      openaiTranscriptionApiKey: "",
    });
  }, []);

  const updateSettings = useCallback((patch: Partial<ChatSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      const {
        apiKey: _apiKey,
        vercelOidcToken: _vercel,
        openaiTranscriptionApiKey: _openaiTx,
        ...persistable
      } = next;
      saveToStorage(SETTINGS_STORAGE_ID, persistable as ChatSettings);
      return next;
    });
  }, []);

  return { settings, updateSettings };
}
