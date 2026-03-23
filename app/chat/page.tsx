"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatMessageRenderer } from "@/components/chat/chat-message-renderer";
import { ChatCvTabs } from "@/components/chat/chat-cv-tabs";
import { renderChatComponent } from "@/components/chat/chat-component-registry";
import { BoltChatInput, RayBackground, AnnouncementBadge, ImportButtons, type AttachedFile } from "@/components/ui/bolt-style-chat";
import { ThinkingIndicator } from "@/components/chat/thinking-indicator";
import { TextSelectionPopover } from "@/components/chat/text-selection-popover";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, User, ChevronDown, Copy, ThumbsDown, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AIModel, ResumeData, Template } from "@/lib/types";
import { defaultResumeData } from "@/lib/default-resume-data";
import { CHAT_MODEL_IDS, DEFAULT_CHAT_MODEL } from "@/lib/chat-models";
import { BOLT_MODELS } from "@/lib/bolt-models";
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
import { getStoredContext } from "@/components/chat/context-window";
import { useToast } from "@/hooks/use-toast";
import { getTextContent } from "@/lib/message-utils";

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
              // Normalize legacy/session data into a strict text part for UIMessage typing
              parts: [{ type: "text" as const, text: m.content ?? getTextContent({ parts: m.parts } as never) }],
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
      setCurrentSessionIdState(sessionId);
      setCurrentSessionId(sessionId);
      setMessages(
        session.messages
          .filter((m) => m.role !== "system")
          .map((m) => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            parts: [{ type: "text" as const, text: m.content ?? getTextContent({ parts: m.parts } as never) }],
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
    if (!input.trim()) return;
    if (!currentSessionId) {
      const newId = generateSessionId();
      setCurrentSessionIdState(newId);
      setCurrentSessionId(newId);
    }
    sendMessage({ text: input.trim() });
    setInput("");
    setAttachedFiles([]);
  };

  const handleAskFromSelection = useCallback((text: string) => {
    setInput(`Regarding: "${text.slice(0, 200)}${text.length > 200 ? "..." : ""}"\n\n`);
  }, []);

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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  const hasComponentBlock = (text: string) =>
    /```\s*component\s*:/i.test(text || "") || /(?:^|\n)\s*component\s*:/i.test(text || "");
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
    const regex = /```\s*component\s*:\s*([A-Za-z][\w-]*)\s*\r?\n([\s\S]*?)```/gi;
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

  return (
    <div className="relative flex h-full min-h-0 w-full flex-1 overflow-hidden bg-[#0f0f0f]">
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
          "flex h-full max-h-full flex-1 flex-col min-h-0 min-w-0 overflow-hidden px-2 py-2 sm:px-4 sm:py-4 transition-[margin] duration-200",
          sidebarOpen ? "lg:ml-[292px]" : ""
        )}
      >
        {!hasMessages ? (
          <>
            <RayBackground />
            <div className="absolute top-[70px] left-1/2 -translate-x-1/2">
              <AnnouncementBadge text="Career Assistant" />
            </div>
            <div className="absolute top-[66%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center w-full px-4">
              <div className="text-center mb-6">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight mb-1">
                  What will you{" "}
                  <span className="bg-gradient-to-b from-[#4da5fc] via-[#4da5fc] to-white bg-clip-text text-transparent italic">
                    build
                  </span>
                  {" "}today?
                </h1>
                <p className="text-base sm:text-lg text-[#8a8a8f]">
                  Create stunning resumes & cover letters by chatting with AI.
                </p>
              </div>
              <div className="w-full max-w-[700px] mb-6 sm:mb-8 mt-2">
                <BoltChatInput
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
              <ImportButtons onImport={handleImport} />
              <div className="flex flex-wrap gap-2 justify-center mt-6">
                {[
                  "Write a cover letter for my resume",
                  "Score my CV against this job",
                  "Suggest job links for my skills",
                  "Generate mock interview questions",
                ].map((prompt) => (
                  <Button
                    key={prompt}
                    variant="outline"
                    size="sm"
                    className="rounded-full border-white/10 bg-[#0f0f0f] hover:bg-[#1a1a1e] text-[#8a8a8f] hover:text-white"
                    onClick={() => setInput(prompt)}
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <TextSelectionPopover
            onAsk={handleAskFromSelection}
            containerRef={messagesContainerRef}
            className="flex flex-1 min-h-0 flex-col"
          >
          <>
            <div
              ref={messagesContainerRef}
              className="flex-1 min-h-0 h-0 overflow-y-scroll overflow-x-hidden overscroll-contain touch-pan-y px-3 py-4 sm:px-4 sm:py-6 md:px-6 lg:px-8"
              onScroll={handleScroll}
            >
              <div className="mx-auto max-w-3xl">
                <div className="space-y-6 pb-8">
                  {messages.map((msg, idx) => {
                    if (msg.role === "system") return null;
                    const content = getTextContent(msg);
                    const extracted = msg.role === "assistant" ? extractComponentBlocks(content) : { blocks: [], markdownOnly: content };
                    const markdownContent = msg.role === "assistant" ? extracted.markdownOnly : content;
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
                            "rounded-2xl px-4 py-3 max-w-[92%] md:max-w-[85%]",
                            msg.role === "user"
                              ? "bg-[#2a2a2e] border border-white/10 text-white"
                              : "bg-transparent border-0 shadow-none px-0"
                          )}
                        >
                          {msg.role === "user" ? (
                            <>
                              <p className="text-sm whitespace-pre-wrap">{content}</p>
                              <p className="mt-1 text-[10px] text-[#8a8a8f]">{formatTs(msgTs)}</p>
                            </>
                          ) : (
                            <>
                              {isStreaming && isLast && !content?.trim() ? (
                                <ThinkingIndicator />
                              ) : (
                                <>
                                  <div className="prose prose-sm max-w-none dark:prose-invert prose-p:text-[#e0e0e5]">
                                    <ChatMessageRenderer
                                      content={markdownContent || ""}
                                      isStreaming={isStreaming && isLast}
                                      dark
                                      cvContext={{
                                        resumeData,
                                        setResumeData,
                                        template,
                                        setTemplate,
                                      }}
                                    />
                                  </div>
                                  {msg.role === "assistant" && extracted.blocks.length > 0 && (
                                    <div className="mt-4 space-y-4">
                                      {extracted.blocks.map((b, bi) => (
                                        <div key={`${msg.id}-comp-${bi}`}>
                                          {b.type === "cv" ? (
                                            <ChatCvTabs
                                              resumeData={((b.props as { resumeData?: ResumeData })?.resumeData ?? resumeData) as ResumeData}
                                              setResumeData={setResumeData}
                                              template={((b.props as { template?: Template })?.template ?? template) as Template}
                                              setTemplate={setTemplate}
                                            />
                                          ) : (
                                            renderChatComponent(b.type, b.props, {
                                              cv: {
                                                resumeData,
                                                setResumeData,
                                                template,
                                                setTemplate,
                                              },
                                            })
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {msg.role === "assistant" && !hasComponentBlock(content) && inferredFallbackType && (
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
                                        onClick={() => navigator.clipboard.writeText(content)}
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
                className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 rounded-full bg-[#1a1a1e]/95 backdrop-blur-xl border border-white/10 text-sm text-[#a0a0a5] hover:text-white hover:bg-white/5 transition-colors shadow-lg"
              >
                <ChevronDown className="h-4 w-4" />
                Scroll to bottom
              </button>
            )}
            <div className="shrink-0 px-4 py-3 md:px-6 md:py-4 border-t border-white/5 bg-[#0f0f0f]/90 backdrop-blur-sm">
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
