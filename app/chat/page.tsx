"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatMessageRenderer } from "@/components/chat/chat-message-renderer";
import { ChatCvTabs } from "@/components/chat/chat-cv-tabs";
import { renderChatComponent } from "@/components/chat/chat-component-registry";
import { BoltChatInput, RayBackground, AnnouncementBadge, type AttachedFile } from "@/components/ui/bolt-style-chat";
import { ThinkingIndicator } from "@/components/chat/thinking-indicator";
import { TextSelectionPopover } from "@/components/chat/text-selection-popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, User, ChevronDown, Copy, ThumbsDown, RotateCw, Paperclip, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AIModel, ResumeData, Template } from "@/lib/types";
import { defaultResumeData } from "@/lib/default-resume-data";
import { CHAT_MODEL_IDS, DEFAULT_CHAT_MODEL } from "@/lib/chat-models";
import { BOLT_MODELS } from "@/lib/bolt-models";
import { motion } from "framer-motion";
import {
  importChatHistoryFromJson,
  getChatSession,
  saveChatSession,
  getCurrentSessionId,
  setCurrentSessionId,
  generateSessionId,
  getSessionTitle,
  deleteChatSession,
} from "@/lib/chat-history";
import type { ChatMessage } from "@/lib/chat-history";
import { getStoredContext } from "@/components/chat/context-window";
import { useToast } from "@/hooks/use-toast";
import { getTextContent, getMessageFileParts } from "@/lib/message-utils";
import type { FileUIPart } from "ai";
import { copyToClipboard } from "@/lib/clipboard";
import { stripIncompleteJsonTail } from "@/lib/streaming-chat-content";

function attachedFilesToFileParts(files: AttachedFile[]): FileUIPart[] {
  return files.map((f) => ({
    type: "file" as const,
    mediaType: f.type || "application/octet-stream",
    filename: f.name,
    url: f.data.startsWith("data:") ? f.data : `data:${f.type || "application/octet-stream"};base64,${f.data}`,
  }));
}

/** Restore useChat message parts from persisted session (keep file attachments). */
function partsFromStoredMessage(m: {
  content?: string;
  parts?: ChatMessage["parts"];
}): Array<{ type: "text"; text: string } | FileUIPart> {
  const raw = m.parts;
  if (Array.isArray(raw) && raw.length > 0) {
    const out: Array<{ type: "text"; text: string } | FileUIPart> = [];
    for (const p of raw) {
      if (!p || typeof p !== "object") continue;
      const t = (p as { type?: string }).type;
      if (t === "text" && typeof (p as { text?: string }).text === "string") {
        out.push({ type: "text", text: (p as { text: string }).text });
      } else if (t === "file" && typeof (p as { url?: string }).url === "string") {
        const fp = p as { url: string; mediaType?: string; filename?: string };
        out.push({
          type: "file",
          url: fp.url,
          mediaType: fp.mediaType || "application/octet-stream",
          filename: fp.filename,
        });
      }
    }
    if (out.length > 0) return out;
  }
  const text = m.content ?? "";
  return [{ type: "text", text }];
}

const CHAT_STORAGE_IDS = {
  model: "chat-assistant-model-store",
  accessStore: "chat-assistant-access-store",
  resumeData: "chat-assistant-resume-data-store",
  template: "chat-assistant-template-store",
};

export default function ChatPage() {
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const appliedCvFromMessageRef = useRef<string | null>(null);

  const [selectedModel, setSelectedModel] = useState<AIModel>(() => {
    if (typeof window !== "undefined") {
      const s = localStorage.getItem(CHAT_STORAGE_IDS.model);
      if (s && CHAT_MODEL_IDS.includes(s as never)) return s as AIModel;
    }
    return DEFAULT_CHAT_MODEL as AIModel;
  });

  const [apiKey, setApiKey] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(CHAT_STORAGE_IDS.accessStore) || "";
    }
    return "";
  });

  const [resumeData, setResumeData] = useState<ResumeData>(() => {
    if (typeof window !== "undefined") {
      const s = localStorage.getItem(CHAT_STORAGE_IDS.resumeData);
      if (s) {
        try {
          return JSON.parse(s);
        } catch {
          return defaultResumeData;
        }
      }
    }
    return defaultResumeData;
  });

  const [template, setTemplate] = useState<Template>(() => {
    if (typeof window !== "undefined") {
      const s = localStorage.getItem(CHAT_STORAGE_IDS.template);
      return (s as Template) || "modern";
    }
    return "modern";
  });

  const [currentSessionId, setCurrentSessionIdState] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  const bodyRef = useRef({
    resumeData,
    model: selectedModel,
    apiKey,
    contextText: "",
    attachedFiles: [] as AttachedFile[],
  });
  bodyRef.current = {
    resumeData,
    model: selectedModel,
    apiKey,
    contextText: typeof window !== "undefined" ? getStoredContext() : "",
    attachedFiles,
  };

  const {
    messages,
    sendMessage,
    setMessages,
    status,
    stop,
  } = useChat({
    onError: (err) => {
      toast({
        title: "Error",
        description: err?.message || "Failed to get response",
        variant: "destructive",
      });
    },
    transport: new DefaultChatTransport({
      api: "/api/chat-assistant",
      prepareSendMessagesRequest: ({ messages: msgs, id }) => {
        const ctx = typeof window !== "undefined" ? getStoredContext() : "";
        return {
          body: {
            ...bodyRef.current,
            messages: msgs,
            id,
            contextText: ctx,
            attachedData: bodyRef.current.attachedFiles,
          },
        };
      },
    }),
  });

  const initSession = useCallback(() => {
    if (typeof window === "undefined") return;
    appliedCvFromMessageRef.current = null;
    const saved = getCurrentSessionId();
    if (saved) {
      const session = getChatSession(saved);
      if (session?.messages?.length) {
        setCurrentSessionIdState(saved);
        setMessages(
          session.messages
            .filter((m) => m.role !== "system")
            .map((m) => ({
              id: m.id,
              role: m.role as "user" | "assistant",
              parts: partsFromStoredMessage(m),
              createdAt: m.createdAt,
            }))
        );
        return;
      }
    }
    const newId = generateSessionId();
    setCurrentSessionIdState(newId);
    setCurrentSessionId(newId);
    setMessages([]);
  }, [setMessages]);

  useEffect(() => {
    initSession();
  }, [initSession]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(CHAT_STORAGE_IDS.model, selectedModel);
    }
  }, [selectedModel]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(CHAT_STORAGE_IDS.accessStore, apiKey);
    }
  }, [apiKey]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(CHAT_STORAGE_IDS.resumeData, JSON.stringify(resumeData));
    }
  }, [resumeData]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(CHAT_STORAGE_IDS.template, template);
    }
  }, [template]);

  const handleNewSession = useCallback(() => {
    appliedCvFromMessageRef.current = null;
    if (currentSessionId && messages.length > 0) {
      saveChatSession({
        id: currentSessionId,
        title: getSessionTitle(messages, "New chat"),
        messages: messages.map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant" | "system",
          content: getTextContent(m),
          parts: m.parts,
          createdAt: (m as { createdAt?: number }).createdAt ?? Date.now(),
        })),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    const newId = generateSessionId();
    setCurrentSessionIdState(newId);
    setCurrentSessionId(newId);
    setMessages([]);
  }, [setMessages, currentSessionId, messages]);

  const handleSessionSelect = useCallback(
    (sessionId: string) => {
      const session = getChatSession(sessionId);
      if (!session) return;
      appliedCvFromMessageRef.current = null;
      setCurrentSessionIdState(sessionId);
      setCurrentSessionId(sessionId);
      setMessages(
        session.messages
          .filter((m) => m.role !== "system")
          .map((m) => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            parts: partsFromStoredMessage(m),
            createdAt: m.createdAt,
          }))
      );
    },
    [setMessages]
  );

  const handleDeleteSession = useCallback(
    (sessionId: string) => {
      deleteChatSession(sessionId);
      if (currentSessionId === sessionId) {
        handleNewSession();
      }
    },
    [currentSessionId, handleNewSession]
  );

  const handleImportHistory = useCallback(
    (json: string) => {
      try {
        const sessions = importChatHistoryFromJson(json);
        if (sessions.length > 0 && sessions[0].messages?.length) {
          const first = sessions[0];
          handleSessionSelect(first.id);
          toast({
            title: "Imported",
            description: `${first.messages.length} messages loaded.`,
          });
        } else {
          toast({ title: "No messages", description: "File has no chat messages." });
        }
      } catch {
        toast({
          title: "Import failed",
          description: "Invalid JSON.",
          variant: "destructive",
        });
      }
    },
    [handleSessionSelect, toast]
  );

  const handleModelChange = useCallback(
    (model: { id: string }) => {
      setSelectedModel(model.id as AIModel);
    },
    []
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    const fileParts = attachedFilesToFileParts(attachedFiles);
    if (!trimmed && fileParts.length === 0) return;
    if (!currentSessionId) {
      const newId = generateSessionId();
      setCurrentSessionIdState(newId);
      setCurrentSessionId(newId);
    }
    if (fileParts.length > 0 && trimmed) {
      sendMessage({ text: trimmed, files: fileParts });
    } else if (fileParts.length > 0) {
      sendMessage({ files: fileParts });
    } else {
      sendMessage({ text: trimmed });
    }
    setInput("");
    setAttachedFiles([]);
  };

  const handleAskFromSelection = useCallback(
    (text: string) => {
      const excerpt = text.slice(0, 200) + (text.length > 200 ? "..." : "");
      setInput(`Regarding this excerpt:\n"${excerpt}"\n\n`);
      toast({
        title: "Added to message",
        description: "Your selection was inserted into the input. Edit and send when ready.",
      });
    },
    [toast]
  );

  const handleScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    setShowScrollToBottom(scrollHeight - scrollTop - clientHeight > 120);
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleImport = useCallback(
    (source: string) => {
      if (source === "github") {
        const inputEl = document.createElement("input");
        inputEl.type = "file";
        inputEl.accept = ".json";
        inputEl.onchange = (ev) => {
          const file = (ev.target as HTMLInputElement).files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = () => {
              try {
                handleImportHistory(String(reader.result));
              } catch {
                toast({ title: "Import failed", variant: "destructive" });
              }
            };
            reader.readAsText(file);
          }
        };
        inputEl.click();
      }
      toast({ title: "Import", description: `Import from ${source} - use sidebar to upload JSON.` });
    },
    [handleImportHistory, toast]
  );

  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const onScroll = () => handleScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    handleScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, [handleScroll, messages.length]);

  const isStreaming = status === "streaming" || status === "submitted";
  const hasMessages = messages.length > 0;

  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el || messages.length === 0) return;
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (dist < 160) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const hasComponentBlock = (text: string) =>
    /```\s*component\s*:/i.test(text || "") || /(?:^|\n)\s*component\s*:/i.test(text || "");
  const hasJsonEnvelopeComponent = (text: string) =>
    /```(?:json|javascript|js|ts|typescript)?\s*[\r\n]+[\s\S]*?"component(?:Type)?"\s*:\s*"/i.test(text || "");
  /** Model often streams raw `{"resumeData":...}` without a fence — treat as component load. */
  const looksLikeResumePayload = (text: string) =>
    /\{[\s\S]*"resumeData"\s*:/.test(text || "") ||
    /```(?:json)?[\s\S]*"resumeData"\s*:/i.test(text || "");
  const isLikelyComponentResponse = (text: string) =>
    hasComponentBlock(text) || hasJsonEnvelopeComponent(text) || looksLikeResumePayload(text);
  const normalizeComponentType = (
    s: string
  ): "cv" | "coverLetter" | "jobLinks" | "cvScorer" | "course" | "mockInterview" | "hrNote" | "jobApplySimulator" | null => {
    const key = (s || "").trim().toLowerCase();
    const map: Record<string, "cv" | "coverLetter" | "jobLinks" | "cvScorer" | "course" | "mockInterview" | "hrNote" | "jobApplySimulator"> = {
      cv: "cv",
      coverletter: "coverLetter",
      joblinks: "jobLinks",
      cvscorer: "cvScorer",
      course: "course",
      mockinterview: "mockInterview",
      hrnote: "hrNote",
      jobapplysimulator: "jobApplySimulator",
    };
    return map[key] ?? null;
  };
  const extractComponentBlocks = (text: string) => {
    const blocks: Array<{ type: "cv" | "coverLetter" | "jobLinks" | "cvScorer" | "course" | "mockInterview" | "hrNote" | "jobApplySimulator"; props: unknown }> = [];
    const regex = /```\s*component\s*:\s*([A-Za-z][\w-]*)\s*([\s\S]*?)```/gi;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text || "")) !== null) {
      const normalized = normalizeComponentType(match[1] || "");
      if (!normalized) continue;
      try {
        const props = JSON.parse((match[2] || "{}").trim() || "{}");
        blocks.push({ type: normalized, props });
      } catch {
        blocks.push({ type: normalized, props: {} });
      }
    }
    // IMPORTANT: reset regex lastIndex after using .exec with global regex.
    // Otherwise .replace may miss some matches and the component block remains visible as text.
    regex.lastIndex = 0;
    const markdownOnly = (text || "").replace(regex, "").trim();
    return { blocks, markdownOnly };
  };
  const isResumeIntent = (text: string) => /(\bcv\b|resume|curriculum vitae|profile|editor|pdf)/i.test(text || "");
  const inferComponentType = (
    userText: string
  ): "cv" | "coverLetter" | "jobLinks" | "cvScorer" | "course" | "mockInterview" | "hrNote" | "jobApplySimulator" | null => {
    const t = (userText || "").toLowerCase();
    if (/\b(cover\s*letter)\b/.test(t)) return "coverLetter";
    if (/\b(job\s*links?|opportunit(y|ies)|job\s*matches?)\b/.test(t)) return "jobLinks";
    if (/\b(score|ats|match|cv\s*score|resume\s*score)\b/.test(t)) return "cvScorer";
    if (/\b(course|learning|roadmap|upskill)\b/.test(t)) return "course";
    if (/\b(mock\s*interview|interview\s*questions?|coding\s*problems?)\b/.test(t)) return "mockInterview";
    if (/\b(hr|email|note\s*to\s*hr)\b/.test(t)) return "hrNote";
    if (/\b(apply|job\s*apply|auto\s*apply|simulator)\b/.test(t)) return "jobApplySimulator";
    if (isResumeIntent(t)) return "cv";
    return null;
  };
  const formatTs = (ts?: number) => {
    const d = ts ? new Date(ts) : new Date();
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // If assistant returns a CV component payload, hydrate chat CV state once per message.
  // This keeps the rendered CV tabs editable (state-driven) instead of frozen props.
  useEffect(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (!m || m.role !== "assistant") continue;
      if (appliedCvFromMessageRef.current === m.id) break;
      const text = getTextContent(m);
      const { blocks } = extractComponentBlocks(text);
      const cvBlock = blocks.find((b) => b.type === "cv");
      if (!cvBlock) break;
      const payload = cvBlock.props as { resumeData?: ResumeData; template?: Template };
      if (payload.resumeData && typeof payload.resumeData === "object") {
        setResumeData(payload.resumeData);
      }
      if (payload.template && typeof payload.template === "string") {
        setTemplate(payload.template as Template);
      }
      appliedCvFromMessageRef.current = m.id;
      break;
    }
  }, [messages]);

  return (
    <div className="relative flex h-full min-h-0 w-full flex-1 overflow-hidden bg-background text-foreground dark:bg-[#0a0a0c] dark:bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(17,114,226,0.12),transparent_55%),radial-gradient(ellipse_80%_50%_at_100%_50%,rgba(99,102,241,0.06),transparent_50%)]">
      <ChatSidebar
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          apiKey={apiKey}
          onApiKeyChange={setApiKey}
          onImportHistory={handleImportHistory}
          currentMessages={messages.map((m) => ({
            id: m.id,
            role: m.role,
            content: getTextContent(m),
            parts: m.parts,
            createdAt: (m as { createdAt?: number }).createdAt,
          }))}
          currentSessionId={currentSessionId}
          onSessionSelect={handleSessionSelect}
          onNewSession={handleNewSession}
          onDeleteSession={handleDeleteSession}
          collapsible
          open={sidebarOpen}
          onOpenChange={setSidebarOpen}
        />

      <main
        className={cn(
          "flex h-full max-h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden pl-12 pr-2 py-2 transition-[margin] duration-200 sm:px-4 sm:py-4 lg:pl-2",
          sidebarOpen ? "lg:ml-[calc(1rem+20rem+1rem)]" : ""
        )}
      >
        {!hasMessages ? (
          <>
            <RayBackground />
            <div className="pointer-events-none absolute top-3 left-1/2 z-[2] -translate-x-1/2 sm:top-5">
              <div className="pointer-events-auto">
                <AnnouncementBadge text="Career Assistant" />
              </div>
            </div>
            <div className="relative z-[1] flex h-full min-h-0 w-full flex-col items-center justify-between px-4">
              <div className="flex-1 w-full max-w-[820px] flex items-center justify-center">
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.99 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="w-full rounded-3xl border border-border bg-card/80 p-6 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_18px_80px_-30px_rgba(77,165,252,0.35)] sm:p-8"
                >
                  <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl dark:text-white">
                      How can I help you?
                    </h1>
                    <p className="mt-3 text-base text-muted-foreground sm:text-lg">
                      Chat to generate your resume, cover letter, job plan, and interactive workflows.
                    </p>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                    {[
                      {
                        label: "Create",
                        prompt: "Create a modern CV for full-stack developer. Include projects, achievements, and ATS-friendly formatting.",
                      },
                      {
                        label: "Explore",
                        prompt: "Suggest job links and roles based on my skills. Then propose a 7-day job search plan.",
                      },
                      {
                        label: "Code",
                        prompt: "Generate mock coding problems for my target role (full-stack). Include difficulty progression and expected approaches.",
                      },
                      {
                        label: "Learn",
                        prompt: "Recommend learning courses for full-stack development. Include a roadmap and practice tasks.",
                      },
                    ].map((pill) => (
                      <button
                        key={pill.label}
                        type="button"
                        onClick={() => setInput(pill.prompt)}
                        className="inline-flex items-center justify-center rounded-full border border-border bg-muted/60 px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-all duration-200 hover:bg-muted active:scale-[0.98] dark:border-white/10 dark:bg-gradient-to-b dark:from-white/10 dark:to-white/5 dark:text-white/90 dark:shadow-[0_10px_40px_-20px_rgba(255,255,255,0.25)] dark:hover:shadow-[0_18px_60px_-30px_rgba(77,165,252,0.35)]"
                      >
                        {pill.label}
                      </button>
                    ))}
                  </div>

                  <div className="mt-8 w-full max-w-[680px] mx-auto">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Suggested prompts
                      </p>
                    </div>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        "Write a cover letter for my resume and the job I’m applying to.",
                        "Score my CV against this job description and highlight gaps.",
                        "Generate a mock interview plan and questions for my role.",
                        "Create an HR email to follow up after an interview.",
                      ].map((prompt) => (
                        <motion.button
                          key={prompt}
                          type="button"
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setInput(prompt)}
                          className="text-left rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm text-foreground/90 transition-all duration-200 hover:bg-muted dark:border-white/10 dark:bg-[#0f0f0f]/30 dark:text-[#cfcfd3] dark:hover:bg-[#1a1a1e] dark:hover:text-white"
                        >
                          {prompt}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>

              <div className="w-full pb-4">
                <div className="mx-auto w-full max-w-[820px]">
                  <BoltChatInput
                    compact
                    value={input}
                    onChange={setInput}
                    onSubmit={handleSubmit}
                    placeholder="Ask for cover letter, CV score, job links, mock interview..."
                    isLoading={isStreaming}
                    onStop={stop}
                    models={BOLT_MODELS}
                    selectedModelId={selectedModel}
                    onModelChange={handleModelChange}
                    attachedFiles={attachedFiles}
                    onFilesChange={setAttachedFiles}
                  />
                </div>
              </div>
            </div>
          </>
        ) : (
          <TextSelectionPopover
            onAsk={handleAskFromSelection}
            onCopy={() =>
              toast({
                title: "Copied",
                description: "Selected text copied to clipboard.",
              })
            }
            onCopyFailed={() =>
              toast({
                title: "Copy failed",
                description: "Allow clipboard access or try Cmd/Ctrl+C manually.",
                variant: "destructive",
              })
            }
            containerRef={messagesContainerRef}
            className="relative flex flex-1 min-h-0 flex-col"
          >
          <>
            <div
              ref={messagesContainerRef}
              className="h-0 min-h-0 flex-1 touch-pan-y overflow-y-scroll overflow-x-hidden overscroll-contain px-3 py-4 sm:px-4 sm:py-6 md:px-6 lg:px-8"
              onScroll={handleScroll}
            >
              <div className="mx-auto w-full max-w-4xl rounded-2xl border border-border/80 bg-muted/20 shadow-inner sm:rounded-3xl sm:px-2 sm:py-2 md:px-4 md:py-3 xl:max-w-5xl dark:border-white/[0.06] dark:bg-white/[0.02] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
                <div className="space-y-6 pb-8">
                  {messages.map((msg, idx) => {
                    if (msg.role === "system") return null;
                    const content = getTextContent(msg);
                    const fileAttachments = getMessageFileParts(msg);
                    const msgTs = (msg as { createdAt?: number }).createdAt;
                    const isLast = msg.id === messages[messages.length - 1]?.id;
                    const prevUserText =
                      idx > 0 && messages[idx - 1]?.role === "user"
                        ? getTextContent(messages[idx - 1])
                        : "";
                    const inferredFallbackType =
                      msg.role === "assistant"
                        ? inferComponentType(`${prevUserText}\n${content}`)
                        : null;
                    const visibleStreamingText = stripIncompleteJsonTail(content || "", isStreaming && isLast);
                    const showComponentStreamSkeleton =
                      isStreaming &&
                      isLast &&
                      isLikelyComponentResponse(content || "") &&
                      Boolean(visibleStreamingText.trim());
                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex gap-3 md:gap-4",
                          msg.role === "user" ? "justify-end" : "justify-start"
                        )}
                      >
                        {msg.role === "assistant" && (
                          <Avatar className="h-8 w-8 md:h-9 md:w-9 shrink-0 ring-2 ring-[#1172e2]/30">
                            <AvatarFallback className="bg-[#1172e2] text-white">
                              <Bot className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={cn(
                            "rounded-2xl px-4 py-3 transition-colors",
                            msg.role === "user"
                              ? "max-w-[min(92%,36rem)] select-text border border-primary/20 bg-primary/10 text-foreground shadow-md dark:border-white/12 dark:bg-gradient-to-br dark:from-zinc-800/95 dark:to-zinc-900/90 dark:text-white dark:shadow-lg dark:shadow-black/25"
                              : "max-w-[min(100%,48rem)] select-text border border-border bg-card text-card-foreground shadow-sm backdrop-blur-md sm:px-5 md:max-w-[min(85%,40rem)] dark:border-white/[0.07] dark:bg-[#0c0d12]/75 dark:shadow-[0_8px_40px_-20px_rgba(0,0,0,0.45)]"
                          )}
                        >
                          {msg.role === "user" ? (
                            <>
                              {fileAttachments.length > 0 && (
                                <ul className="mb-2 flex flex-col gap-1.5 sm:flex-row sm:flex-wrap" aria-label="Attachments">
                                  {fileAttachments.map((fp, fi) => {
                                    const isImg = (fp.mediaType || "").startsWith("image/");
                                    return (
                                      <li
                                        key={`${fp.filename ?? fi}-${fi}`}
                                        className="flex min-w-0 max-w-full items-center gap-2 rounded-xl border border-border bg-muted/50 px-2.5 py-1.5 text-left sm:max-w-[min(100%,14rem)] dark:border-white/15 dark:bg-white/5"
                                      >
                                        {isImg ? (
                                          <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/30">
                                            <img
                                              src={fp.url}
                                              alt=""
                                              className="h-full w-full object-cover"
                                            />
                                          </span>
                                        ) : (
                                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/25">
                                            {fp.mediaType === "application/pdf" || (fp.filename || "").endsWith(".pdf") ? (
                                              <FileText className="h-4 w-4 text-[#8a8a8f]" />
                                            ) : (
                                              <Paperclip className="h-4 w-4 text-[#8a8a8f]" />
                                            )}
                                          </span>
                                        )}
                                        <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground dark:text-white/90" title={fp.filename}>
                                          {fp.filename || "Attachment"}
                                        </span>
                                      </li>
                                    );
                                  })}
                                </ul>
                              )}
                              {Boolean(content?.trim()) && (
                                <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
                              )}
                              {!content?.trim() && fileAttachments.length > 0 && (
                                <p className="text-xs text-muted-foreground">Sent with attachment(s)</p>
                              )}
                              <p className="mt-1 text-[10px] text-muted-foreground">{formatTs(msgTs)}</p>
                            </>
                          ) : (
                            <>
                              {isStreaming && isLast && !content?.trim() ? (
                                <ThinkingIndicator />
                              ) : (
                                <>
                                  <div className="prose prose-sm max-w-none select-text dark:prose-invert">
                                    <ChatMessageRenderer
                                      content={content || ""}
                                      isStreaming={isStreaming && isLast}
                                      cvContext={{
                                        resumeData,
                                        setResumeData,
                                        template,
                                        setTemplate,
                                      }}
                                    />
                                  </div>
                                  {isStreaming && isLast && Boolean(content?.trim()) && (
                                    <p
                                      className="mt-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
                                      aria-live="polite"
                                    >
                                      <span className="inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-primary dark:bg-[#1172e2]" />
                                      Generating response
                                    </p>
                                  )}
                                  {showComponentStreamSkeleton && (
                                    <div
                                      className="mt-4 w-full max-w-2xl space-y-3 rounded-xl border border-border bg-muted/30 p-4 dark:border-white/10 dark:bg-white/[0.03]"
                                      aria-hidden
                                    >
                                      <div className="flex items-center gap-2">
                                        <Skeleton className="h-5 w-36 rounded-md" />
                                        <Skeleton className="h-5 w-20 rounded-md opacity-70" />
                                      </div>
                                      <Skeleton className="h-4 w-[88%] rounded-md" />
                                      <Skeleton className="h-4 w-full rounded-md" />
                                      <div className="grid gap-2 sm:grid-cols-2">
                                        <Skeleton className="h-24 w-full rounded-lg" />
                                        <Skeleton className="h-24 w-full rounded-lg" />
                                      </div>
                                    </div>
                                  )}
                                  {msg.role === "assistant" && !isLikelyComponentResponse(content) && inferredFallbackType && (
                                    <div className="mt-4">
                                      {inferredFallbackType === "cv" ? (
                                        <ChatCvTabs
                                          resumeData={resumeData}
                                          setResumeData={setResumeData}
                                          template={template}
                                          setTemplate={setTemplate}
                                        />
                                      ) : (
                                        renderChatComponent(inferredFallbackType, {}, {
                                          cv: {
                                            resumeData,
                                            setResumeData,
                                            template,
                                            setTemplate,
                                          },
                                        })
                                      )}
                                    </div>
                                  )}
                                  {!isStreaming && isLast && (
                                    <div className="flex items-center gap-2 mt-2 opacity-60 hover:opacity-100 transition-opacity">
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          const ok = await copyToClipboard(content);
                                          toast(
                                            ok
                                              ? {
                                                  title: "Copied",
                                                  description: "Message copied to clipboard.",
                                                }
                                              : {
                                                  title: "Copy failed",
                                                  description: "Could not copy. Try selecting text manually.",
                                                  variant: "destructive",
                                                }
                                          );
                                        }}
                                        className="flex items-center gap-1 text-xs text-[#8a8a8f] hover:text-white"
                                      >
                                        <Copy className="h-3.5 w-3.5" /> Copy
                                      </button>
                                      <button type="button" className="flex items-center gap-1 text-xs text-[#8a8a8f] hover:text-white" aria-label="Feedback">
                                        <ThumbsDown className="h-3.5 w-3.5" />
                                      </button>
                                      <button type="button" className="flex items-center gap-1 text-xs text-[#8a8a8f] hover:text-white" aria-label="Regenerate">
                                        <RotateCw className="h-3.5 w-3.5" />
                                      </button>
                                      <span className="text-[10px] text-[#5a5a5f] ml-1">{selectedModel}</span>
                                      <span className="text-[10px] text-[#8a8a8f] ml-1">{formatTs(msgTs)}</span>
                                    </div>
                                  )}
                                </>
                              )}
                            </>
                          )}
                        </div>
                        {msg.role === "user" && (
                          <Avatar className="h-8 w-8 md:h-9 md:w-9 shrink-0">
                            <AvatarFallback className="bg-[#2a2a2e] text-white">
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            </div>
            {showScrollToBottom && (
              <button
                type="button"
                onClick={scrollToBottom}
                className="pointer-events-auto absolute bottom-[5.5rem] left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-popover px-4 py-2 text-sm text-muted-foreground shadow-lg backdrop-blur-xl transition-colors hover:bg-muted hover:text-foreground sm:bottom-28 dark:border-white/10 dark:bg-[#1a1a1e]/95 dark:text-[#a0a0a5] dark:hover:bg-white/5 dark:hover:text-white"
              >
                <ChevronDown className="h-4 w-4" />
                Scroll to bottom
              </button>
            )}
            <div className="shrink-0 border-t border-border/80 bg-background/95 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm dark:border-white/5 dark:bg-[#0f0f0f]/90 sm:px-4 md:px-6 md:py-4">
              <BoltChatInput
                value={input}
                onChange={setInput}
                onSubmit={handleSubmit}
                placeholder="Type your message here..."
                isLoading={isStreaming}
                onStop={stop}
                models={BOLT_MODELS}
                selectedModelId={selectedModel}
                onModelChange={handleModelChange}
                compact
                attachedFiles={attachedFiles}
                onFilesChange={setAttachedFiles}
              />
            </div>
          </>
          </TextSelectionPopover>
        )}
      </main>
    </div>
  );
}
