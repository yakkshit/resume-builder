"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    Send,
    Sparkles,
    FileText,
    Briefcase,
    Code,
    BookOpen,
    Paperclip,
    Copy,
    RotateCcw,
    Bot,
    User,
    Loader2,
    ChevronRight,
    Menu,
    X,
    AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Toaster, { ToasterRef } from '@/components/ui/toast';
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { InfiniteGridBackground } from "@/components/ui/the-infinite-grid";

import { MarkdownRenderer } from "./markdown-renderer";
import { ChatSidebar } from "./sidebar";
import { ComponentRenderer } from "./component-renderer";
import { useChatSettings, ChatMessage, AVAILABLE_MODELS } from "./chat-store";
import { getTextContent } from "@/lib/message-utils";

// ── Welcome Screen ─────────────────────────────────────────────────────────

const ACTION_PILLS = [
    { label: "Create", icon: FileText, prompt: "Help me create and show my resume" },
    { label: "Explore", icon: Briefcase, prompt: "Find job recommendations for me" },
    { label: "Code", icon: Code, prompt: "Give me a coding challenge" },
    { label: "Learn", icon: BookOpen, prompt: "Recommend learning resources for me" },
];

const SUGGESTED_PROMPTS = [
    "Show me my resume",
    "Analyze my CV score against a job description",
    "Find jobs for me",
    "Start auto-applying to jobs",
    "Give me a coding challenge",
    "Practice mock interview questions",
];

function WelcomeScreen({ onPrompt }: { onPrompt: (p: string) => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center justify-center min-h-[75vh] px-4 py-8 text-center"
        >
            <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className="w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-500/20 via-neutral-900 to-neutral-800 border-2 border-white/10 flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(99,102,241,0.2)] backdrop-blur-xl"
            >
                <Sparkles className="w-8 h-8 text-indigo-400 drop-shadow-md" />
            </motion.div>

            <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-b from-white via-white/90 to-white/20 pb-2">
                How can I help you?
            </h1>
            <p className="text-base md:text-lg text-muted-foreground/80 mb-10 max-w-lg mx-auto font-medium">
                Your AI-powered career assistant for <span className="text-white/90">resumes</span>, <span className="text-white/90">jobs</span>, and <span className="text-white/90">interviews</span>.
            </p>

            <div className="flex flex-wrap justify-center gap-2 mb-8">
                {ACTION_PILLS.map((pill, i) => (
                    <motion.button
                        key={pill.label}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 + i * 0.07 }}
                        onClick={() => onPrompt(pill.prompt)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-border bg-background hover:bg-muted hover:border-foreground/20 transition-all text-sm font-medium group"
                    >
                        <pill.icon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                        {pill.label}
                    </motion.button>
                ))}
            </div>

            <div className="w-full max-w-lg space-y-2">
                <p className="text-xs text-muted-foreground mb-3 font-medium">Suggested prompts</p>
                {SUGGESTED_PROMPTS.map((p, i) => (
                    <motion.button
                        key={p}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.07 }}
                        onClick={() => onPrompt(p)}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-background/50 hover:bg-muted hover:border-foreground/20 transition-all text-sm text-left group"
                    >
                        <span>{p}</span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 group-hover:text-foreground transition-all" />
                    </motion.button>
                ))}
            </div>
        </motion.div>
    );
}

// ── Inline component extraction from AI response text ──────────────────────

function mapComponentType(rawType: string): Parameters<typeof ComponentRenderer>[0]["type"] | null {
    const t = rawType.toLowerCase();
    if (t === "cv" || t === "resume") return "resume";
    if (t === "cvscorer" || t === "cv-score") return "cv-score";
    if (t === "joblinks" || t === "job-recommendations") return "job-recommendations";
    if (t === "jobapplysimulator" || t === "auto-applier") return "auto-applier";
    if (t === "mockinterview" || t === "mock-interview") return "mock-interview";
    if (t === "course" || t === "learning-resources") return "learning-resources";
    if (t === "codingchallenge" || t === "coding-challenge") return "coding-challenge";
    return null;
}

function extractComponents(text: string) {
    const componentRegex = /```component:([a-zA-Z0-9-]+)\s*([\s\S]*?)(?:```|$)/g;
    const components: { type: Parameters<typeof ComponentRenderer>[0]["type"] | null, data: any, isComplete: boolean }[] = [];

    let cleanText = text;
    let match;

    while ((match = componentRegex.exec(text)) !== null) {
        const rawMatch = match[0];
        const typeStr = match[1];
        const dataStr = match[2].trim();
        const isComplete = rawMatch.endsWith("```");

        let parsedData = {};
        if (dataStr) {
            try {
                parsedData = JSON.parse(dataStr);
            } catch (e) {
                // Partial or invalid JSON (e.g., during streaming)
            }
        }

        components.push({
            type: mapComponentType(typeStr),
            data: parsedData,
            isComplete,
        });

        cleanText = cleanText.replace(rawMatch, "");
    }

    return { cleanText: cleanText.trim(), components };
}

// ── Message Bubble ─────────────────────────────────────────────────────────

function MessageBubble({
    message,
    isStreaming,
    onReply,
    onToast,
}: {
    message: UIMessage;
    isStreaming?: boolean;
    onReply: (text: string) => void;
    onToast: (variant: "default" | "success" | "error" | "warning", msg: string) => void;
}) {
    const isUser = message.role === "user";
    const [hovering, setHovering] = useState(false);
    const content = getTextContent(message) ?? "";

    // Extract dynamic components and clean text
    const extracted = !isUser ? extractComponents(content) : { cleanText: content, components: [] };

    const copy = () => {
        navigator.clipboard.writeText(content);
        onToast("success", "Copied to clipboard!");
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
        >
            {!isUser && (
                <div className="w-8 h-8 rounded-full bg-neutral-900 border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-white" />
                </div>
            )}

            <div className={`flex flex-col gap-3 ${isUser ? "items-end" : "items-start"} max-w-[80%]`}>
                {/* Bubble */}
                <div
                    className={`relative px-4 py-3 rounded-2xl text-sm ${isUser
                        ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-tr-sm"
                        : "bg-background border border-border/60 rounded-tl-sm"
                        }`}
                >
                    {isUser ? (
                        <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
                    ) : (
                        <MarkdownRenderer content={extracted.cleanText} />
                    )}
                    {isStreaming && (
                        <span className="inline-block w-2 h-4 ml-1 bg-current opacity-70 animate-pulse align-text-bottom" />
                    )}

                    {/* Hover actions */}
                    <AnimatePresence>
                        {hovering && !isStreaming && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.85 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.85 }}
                                className={`absolute top-2 flex gap-1 ${isUser ? "-left-16" : "-right-16"}`}
                            >
                                <button onClick={copy} className="p-1.5 bg-background border border-border rounded-lg text-muted-foreground hover:text-foreground shadow-sm">
                                    <Copy className="w-3 h-3" />
                                </button>
                                {!isUser && (
                                    <button onClick={() => onReply(content)} className="p-1.5 bg-background border border-border rounded-lg text-muted-foreground hover:text-foreground shadow-sm">
                                        <RotateCcw className="w-3 h-3" />
                                    </button>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Inline dynamic components */}
                {extracted.components.map((c, idx) => c.type && (!isStreaming || c.isComplete) && (
                    <div key={idx} className="w-full max-w-[640px] mt-2">
                        <ComponentRenderer type={c.type} data={c.data} />
                    </div>
                ))}
            </div>

            {isUser && (
                <div className="w-8 h-8 rounded-full bg-neutral-900 border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-4 h-4 text-white" />
                </div>
            )}
        </motion.div>
    );
}

// ── Input Bar ──────────────────────────────────────────────────────────────

const QUICK_PROMPTS = [
    { emoji: "📄", label: "Resume", prompt: "Show me and edit my resume" },
    { emoji: "⚡", label: "CV Score", prompt: "Analyze my CV score" },
    { emoji: "🔍", label: "Jobs", prompt: "Find jobs for me" },
    { emoji: "🤖", label: "Auto-apply", prompt: "Start auto-applying to jobs" },
    { emoji: "💻", label: "Code", prompt: "Give me a coding challenge" },
    { emoji: "🎤", label: "Interview", prompt: "Practice interview questions" },
    { emoji: "📚", label: "Learn", prompt: "Recommend learning resources" },
];

function ChatInput({
    value,
    onChange,
    onSend,
    onFileAttach,
    attachedFiles,
    onRemoveFile,
    model,
    onModelChange,
    disabled,
}: {
    value: string;
    onChange: (v: string) => void;
    onSend: () => void;
    onFileAttach: (e: React.ChangeEvent<HTMLInputElement>) => void;
    attachedFiles: File[];
    onRemoveFile: (i: number) => void;
    model: string;
    onModelChange: (m: string) => void;
    disabled: boolean;
}) {
    const fileRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleKey = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend();
        }
    };

    const autoResize = () => {
        const ta = textareaRef.current;
        if (!ta) return;
        ta.style.height = "auto";
        ta.style.height = `${Math.min(ta.scrollHeight, 180)}px`;
    };

    const selectedModel = AVAILABLE_MODELS.find((m) => m.value === model);

    return (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 w-full max-w-3xl px-4 z-30">
            {/* Quick prompt chips */}
            {attachedFiles.length === 0 && (
                <div className="flex gap-2 mb-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                    {QUICK_PROMPTS.map((q) => (
                        <button
                            key={q.label}
                            onClick={() => onChange(q.prompt)}
                            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/90 backdrop-blur border border-border/60 text-xs hover:border-foreground/30 hover:bg-muted transition-all shadow-sm"
                        >
                            <span>{q.emoji}</span>
                            <span className="text-muted-foreground">{q.label}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Attached files */}
            {attachedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                    {attachedFiles.map((f, i) => (
                        <div key={i} className="flex items-center gap-1.5 bg-background/90 border border-border/60 rounded-lg px-2.5 py-1.5 text-xs shadow-sm">
                            <FileText className="w-3 h-3 text-muted-foreground" />
                            <span className="max-w-[120px] truncate">{f.name}</span>
                            <button onClick={() => onRemoveFile(i)} className="text-muted-foreground hover:text-destructive ml-1">
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Input container */}
            <div className="flex items-end gap-2 bg-background/95 backdrop-blur-xl border-2 border-border/60 focus-within:border-foreground/30 rounded-2xl px-3 py-2 shadow-xl transition-all">
                {/* Model selector */}
                <Select value={model} onValueChange={onModelChange}>
                    <SelectTrigger className="w-auto h-8 min-w-0 border-0 bg-muted/60 rounded-xl px-2.5 focus:ring-0 text-xs flex-shrink-0 gap-1 shadow-none max-w-[140px]">
                        <SelectValue>
                            <span className="truncate">{selectedModel?.label ?? model}</span>
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                        {AVAILABLE_MODELS.reduce<React.ReactNode[]>((nodes, m, i, arr) => {
                            const prevProvider = i > 0 ? arr[i - 1].provider : null;
                            if (m.provider !== prevProvider) {
                                nodes.push(
                                    <div key={`h-${m.provider}`} className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                                        {m.provider}
                                    </div>
                                );
                            }
                            nodes.push(
                                <SelectItem key={m.value} value={m.value} className="text-xs pl-4">
                                    {m.label}
                                </SelectItem>
                            );
                            return nodes;
                        }, [])}
                    </SelectContent>
                </Select>

                {/* Text input */}
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => { onChange(e.target.value); autoResize(); }}
                    onKeyDown={handleKey}
                    placeholder="Ask me anything about your career…"
                    rows={1}
                    className="flex-1 bg-transparent resize-none outline-none text-sm placeholder:text-muted-foreground py-1.5 leading-relaxed max-h-[180px] overflow-y-auto"
                    style={{ scrollbarWidth: "none" }}
                />

                {/* Attach + send */}
                <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                        onClick={() => fileRef.current?.click()}
                        className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                    >
                        <Paperclip className="w-4 h-4" />
                    </button>
                    <input
                        ref={fileRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={onFileAttach}
                        accept=".pdf,.doc,.docx,.txt,.png,.jpg,.json,.csv"
                    />
                    <button
                        onClick={onSend}
                        disabled={(!value.trim() && attachedFiles.length === 0) || disabled}
                        className="p-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-80 disabled:opacity-30 transition-all"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function AICareerAssistantChat() {
    const { settings, updateSettings } = useChatSettings();
    const [input, setInput] = useState("");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Ref so the transport closure always reads fresh settings
    const settingsRef = useRef(settings);
    settingsRef.current = settings;

    // Get resumeData from localStorage to pass to /api/chat
    const getResumeData = () => {
        if (typeof window === "undefined") return null;
        try {
            const raw = localStorage.getItem("resumeData");
            return raw ? JSON.parse(raw) : null;
        } catch { return null; }
    };

    const toasterRef = useRef<ToasterRef>(null);
    const showToast = (variant: 'default' | 'success' | 'error' | 'warning', msg: string) => {
        toasterRef.current?.show({
            title: variant.charAt(0).toUpperCase() + variant.slice(1),
            message: msg,
            variant,
            position: 'bottom-right',
        });
    };

    // Wire up real AI SDK → /api/chat
    const { messages, sendMessage, status, error, stop, setMessages } = useChat({
        transport: new DefaultChatTransport({
            api: "/api/chat",
            prepareSendMessagesRequest: ({ messages, id }) => ({
                body: {
                    messages,
                    id,
                    model: settingsRef.current.model,
                    apiKey: settingsRef.current.apiKey,
                    contextText: settingsRef.current.contextWindow,
                    resumeData: getResumeData(),
                    aiMode: true,
                    mode: "career-assistant",
                },
            }),
        }),
        onError: (err) => {
            console.error("Chat error:", err);
            showToast("error", `AI error: ${err.message?.slice(0, 80) ?? "Unknown error"}`);
        },
    });

    // History sessions management
    const [sessions, setSessions] = useState<any[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string>("");

    useEffect(() => {
        const saved = localStorage.getItem("chat_sessions");
        if (saved) {
            setSessions(JSON.parse(saved));
            // If there are saved sessions, set the current session to the most recently updated one
            const lastSession = JSON.parse(saved).sort((a: any, b: any) => b.updatedAt - a.updatedAt)[0];
            if (lastSession) {
                setCurrentSessionId(lastSession.id);
            } else {
                // If no sessions, create a default one
                const defaultSession = { id: "default", title: "New Chat", createdAt: Date.now(), updatedAt: Date.now() };
                setSessions([defaultSession]);
                localStorage.setItem("chat_sessions", JSON.stringify([defaultSession]));
                setCurrentSessionId("default");
            }
        } else {
            const defaultSession = { id: "default", title: "New Chat", createdAt: Date.now(), updatedAt: Date.now() };
            setSessions([defaultSession]);
            localStorage.setItem("chat_sessions", JSON.stringify([defaultSession]));
            setCurrentSessionId("default");
        }
    }, []);

    // When currentSessionId changes, load its messages
    useEffect(() => {
        if (!currentSessionId) return;
        const savedMsg = localStorage.getItem(`chat_messages_${currentSessionId}`);
        if (savedMsg) {
            setMessages(JSON.parse(savedMsg));
        } else {
            setMessages([]);
        }
    }, [currentSessionId, setMessages]);

    // When messages change, save them and update session title
    useEffect(() => {
        if (!currentSessionId) return;
        if (messages.length > 0) {
            localStorage.setItem(`chat_messages_${currentSessionId}`, JSON.stringify(messages));

            setSessions((prev) => {
                const next = [...prev];
                const idx = next.findIndex(s => s.id === currentSessionId);
                if (idx !== -1) {
                    const firstMsg = getTextContent(messages[0] || messages[1])?.slice(0, 30);
                    next[idx] = { ...next[idx], title: firstMsg || "Chat", updatedAt: Date.now() };
                    localStorage.setItem("chat_sessions", JSON.stringify(next));
                }
                return next;
            });
        }
    }, [messages, currentSessionId]);

    const handleNewSession = () => {
        const id = Date.now().toString();
        const newSession = { id, title: "New Chat", createdAt: Date.now(), updatedAt: Date.now() };
        const nextSessions = [newSession, ...sessions];
        setSessions(nextSessions);
        localStorage.setItem("chat_sessions", JSON.stringify(nextSessions));
        setCurrentSessionId(id);
    };

    const handleDeleteSession = (id: string) => {
        const nextSessions = sessions.filter((s) => s.id !== id);
        setSessions(nextSessions);
        localStorage.setItem("chat_sessions", JSON.stringify(nextSessions));
        localStorage.removeItem(`chat_messages_${id}`);
        if (currentSessionId === id) {
            if (nextSessions.length > 0) {
                setCurrentSessionId(nextSessions[0].id);
            } else {
                handleNewSession();
            }
        }
    };


    const isLoading = status === "streaming" || status === "submitted";
    const showWelcome = messages.length === 0;

    // Scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const handleSend = useCallback(async () => {
        if (!input.trim() && attachedFiles.length === 0) return;

        let text = input.trim();
        if (attachedFiles.length > 0) {
            text = text ? `${text}\n\n[Attached files: ${attachedFiles.map((f) => f.name).join(", ")}]` : `[Attached files: ${attachedFiles.map((f) => f.name).join(", ")}]`;
        }

        setInput("");
        setAttachedFiles([]);
        sendMessage({ text });
    }, [input, attachedFiles, sendMessage]);

    const handlePrompt = useCallback((p: string) => {
        setInput(p);
        // tiny delay so input state updates before send
        setTimeout(() => {
            sendMessage({ text: p });
            setInput("");
        }, 50);
    }, [sendMessage]);

    const handleExport = () => {
        const json = JSON.stringify({ messages }, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `chat-${Date.now()}.json`;
        a.click();
        showToast("success", "Chat session exported");
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const { messages: imported } = JSON.parse(ev.target?.result as string);
                if (Array.isArray(imported) && imported.length > 0 && imported[0].role) { // Added check for array and role
                    setMessages(imported);
                    showToast("success", "Chat session imported");
                } else {
                    showToast("error", "Invalid session file format"); // Changed message
                }
            } catch {
                showToast("error", "Invalid session file");
            }
        };
        reader.readAsText(file);
    };

    const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        setAttachedFiles((prev) => [...prev, ...files]);
        showToast("success", `${files.length} file(s) attached`);
    };

    return (
        <InfiniteGridBackground className="fixed inset-0">
            <Toaster ref={toasterRef} />

            {/* Sidebar */}
            <ChatSidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                sessions={sessions}
                currentId={currentSessionId}
                settings={settings}
                onSessionSelect={(id) => { setCurrentSessionId(id); setSidebarOpen(false); }}
                onNewSession={() => { handleNewSession(); setSidebarOpen(false); }}
                onDeleteSession={handleDeleteSession}
                onExport={handleExport}
                onImport={handleImport}
                onSettingsChange={updateSettings}
            />

            {/* Menu button */}
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                onClick={() => setSidebarOpen(true)}
                className="fixed top-5 left-5 z-30 w-10 h-10 rounded-full bg-neutral-900 dark:bg-neutral-800 border border-white/10 flex items-center justify-center shadow-lg hover:opacity-80 transition-opacity"
            >
                <Menu className="w-4 h-4 text-white" />
            </motion.button>

            {/* Stop button when streaming */}
            {isLoading && (
                <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="fixed top-5 right-5 z-30 flex items-center gap-2 px-3 py-2 rounded-full bg-neutral-900 text-white text-xs shadow-lg hover:opacity-80 transition-opacity border border-white/10"
                    onClick={stop}
                >
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Stop
                </motion.button>
            )}

            {/* Error banner */}
            {error && (
                <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-destructive/10 border border-destructive/30 text-destructive rounded-xl px-4 py-2 text-xs shadow-lg">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{error.message?.slice(0, 120) ?? "An error occurred"}</span>
                </div>
            )}

            {/* Chat area */}
            <div
                ref={scrollRef}
                className="relative z-10 h-screen overflow-y-auto pb-44 pt-16"
                style={{ scrollbarWidth: "none" }}
            >
                <div className="max-w-3xl mx-auto px-4">
                    <AnimatePresence mode="wait">
                        {showWelcome ? (
                            <WelcomeScreen key="welcome" onPrompt={handlePrompt} />
                        ) : (
                            <motion.div
                                key="messages"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="space-y-6 py-8"
                            >
                                {messages.map((msg, i) => (
                                    <MessageBubble
                                        key={msg.id ?? i}
                                        message={msg}
                                        isStreaming={isLoading && i === messages.length - 1 && msg.role === "assistant"}
                                        onReply={(t) => setInput(`Regarding: "${t.slice(0, 60)}…"\n\n`)}
                                        onToast={showToast}
                                    />
                                ))}

                                {/* Typing indicator while submitted (before streaming starts) */}
                                <AnimatePresence>
                                    {status === "submitted" && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="flex gap-3"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-neutral-900 border border-border flex items-center justify-center">
                                                <Bot className="w-4 h-4 text-white" />
                                            </div>
                                            <div className="bg-background border border-border/60 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Input bar */}
            <ChatInput
                value={input}
                onChange={setInput}
                onSend={handleSend}
                onFileAttach={handleFileAttach}
                attachedFiles={attachedFiles}
                onRemoveFile={(i) => setAttachedFiles((prev) => prev.filter((_, idx) => idx !== i))}
                model={settings.model}
                onModelChange={(m) => updateSettings({ model: m })}
                disabled={isLoading}
            />
        </InfiniteGridBackground>
    );
}
