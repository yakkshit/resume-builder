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
import type { JobSuggestion } from "@/lib/job-scraper/google-jobs";
import { JobSuggestionsPanel } from "./job-suggestions-panel";
import { sanitizeResumeData, mergeResumeDataWithDefault } from "@/lib/sanitize-resume-data";
import { stripIncompleteJsonTail } from "@/lib/streaming-chat-content";
import { mergeAssistantResumeIntoCurrent, extractResumeJsonFromMessage } from "@/lib/extract-resume-json";
import type { ResumeData } from "@/lib/types";

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
    if (t === "coverletter" || t === "cover-letter") return "cover-letter";
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
        const dataStr = (match[2] ?? "").trim();
        const isComplete = rawMatch.endsWith("```");

        let parsedData: any = {};
        if (dataStr && isComplete) {
            const candidate = stripIncompleteJsonTail(dataStr, false).trim();
            const tryParseLoose = (raw: string) => {
                const s = (raw || "").trim();
                if (!s) return null;
                try { return JSON.parse(s); } catch { /* continue */ }

                // Common model glitches: trailing commas, stray semicolons before } or ]
                const repaired = s
                    .replace(/;(\s*[}\]])/g, "$1")
                    .replace(/,\s*([}\]])/g, "$1");
                try { return JSON.parse(repaired); } catch { /* continue */ }

                // Last resort: parse the largest {...} slice and repair again.
                const first = repaired.indexOf("{");
                const last = repaired.lastIndexOf("}");
                if (first >= 0 && last > first) {
                    const slice = repaired.slice(first, last + 1)
                        .replace(/;(\s*[}\]])/g, "$1")
                        .replace(/,\s*([}\]])/g, "$1");
                    try { return JSON.parse(slice); } catch { /* ignore */ }
                }
                return null;
            };

            const maybe = tryParseLoose(candidate);
            parsedData = maybe && typeof maybe === "object" ? maybe : {};
            // Normalize flat resume JSON or odd envelopes into { resumeData } for ResumeViewer
            if (mapComponentType(typeStr) === "resume" && parsedData && typeof parsedData === "object") {
                const rec = parsedData as Record<string, unknown>;
                if (!rec.resumeData) {
                    const unwrapped = extractResumeJsonFromMessage(
                        "```component:cv\n" + JSON.stringify(parsedData) + "\n```"
                    );
                    if (unwrapped) {
                        parsedData = {
                            resumeData: unwrapped,
                            ...(typeof rec.template === "string" ? { template: rec.template } : {}),
                        };
                    }
                }
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

            <div className={`flex flex-col gap-3 ${isUser ? "items-end" : "items-start"} ${isUser ? "max-w-[90%]" : "w-full max-w-[min(980px,calc(100%-3rem))]"}`}>
                {/* Bubble */}
                <div
                    className={`relative px-4 py-3 rounded-2xl text-sm ${isUser
                        ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-tr-sm"
                        : "w-full bg-background border border-border/60 rounded-tl-sm [overflow-wrap:anywhere]"
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
                    <div key={idx} className="w-full mt-2">
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
    useProfileContext,
    onToggleProfileContext,
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
    useProfileContext: boolean;
    onToggleProfileContext: () => void;
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
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 z-30">
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
                        type="button"
                        onClick={onToggleProfileContext}
                        className={`p-2 rounded-xl transition-all ${
                            useProfileContext
                                ? "text-foreground bg-muted"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                        title={
                            useProfileContext
                                ? "Profile & knowledge ON — global profile, career notes, and RAG-style resume chunks are sent with each message"
                                : "Profile & knowledge OFF — only your typed context (sidebar) is sent"
                        }
                        aria-pressed={useProfileContext}
                        aria-label="Toggle global profile and knowledge context"
                    >
                        <User className="w-4 h-4" />
                    </button>
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
    const [jobPanelOpen, setJobPanelOpen] = useState(false);
    const [jobPanelLoading, setJobPanelLoading] = useState(false);
    const [jobPanelProgress, setJobPanelProgress] = useState(0);
    const [jobPanelProgressLabel, setJobPanelProgressLabel] = useState("Searching Google jobs...");
    const [jobPanelJobs, setJobPanelJobs] = useState<JobSuggestion[]>([]);
    const [jobProfileDialogOpen, setJobProfileDialogOpen] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const PROFILE_CONTEXT_TOGGLE_ID = "ai-chat-use-profile-context";
    const [useProfileContext, setUseProfileContext] = useState(true);
    const useProfileContextRef = useRef(true);
    useProfileContextRef.current = useProfileContext;

    useEffect(() => {
        if (typeof window === "undefined") return;
        const raw = localStorage.getItem(PROFILE_CONTEXT_TOGGLE_ID);
        if (raw === "false") setUseProfileContext(false);
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;
        localStorage.setItem(PROFILE_CONTEXT_TOGGLE_ID, useProfileContext ? "true" : "false");
    }, [useProfileContext]);

    const buildProfileContextText = () => {
        if (typeof window === "undefined") return "";
        try {
            const raw = localStorage.getItem("ai-chat-profile");
            if (!raw) return "";
            const p = JSON.parse(raw) as any;
            const bits = [
                typeof p?.name === "string" && p.name ? `Name: ${p.name}` : "",
                typeof p?.email === "string" && p.email ? `Email: ${p.email}` : "",
                typeof p?.phone === "string" && p.phone ? `Phone: ${p.phone}` : "",
                typeof p?.location === "string" && p.location ? `Location: ${p.location}` : "",
                typeof p?.linkedin === "string" && p.linkedin ? `LinkedIn: ${p.linkedin}` : "",
                typeof p?.website === "string" && p.website ? `Website: ${p.website}` : "",
                typeof p?.github === "string" && p.github ? `GitHub: ${p.github}` : "",
                typeof p?.targetRoles === "string" && p.targetRoles ? `Target roles: ${p.targetRoles}` : "",
                typeof p?.careerNotes === "string" && p.careerNotes ? `Career notes: ${p.careerNotes}` : "",
            ].filter(Boolean);
            return bits.length ? `User profile:\n${bits.join("\n")}` : "";
        } catch {
            return "";
        }
    };

    const makeAssistantMessageId = () =>
        `assistant_job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    function loadFullResumeFromStorage(): ResumeData {
        if (typeof window === "undefined") return mergeResumeDataWithDefault(null);
        try {
            const raw = localStorage.getItem("resumeData");
            return mergeResumeDataWithDefault(raw ? JSON.parse(raw) : null);
        } catch {
            return mergeResumeDataWithDefault(null);
        }
    }

    const readChatGlobalProfile = (): Record<string, unknown> | null => {
        if (typeof window === "undefined") return null;
        try {
            const raw = localStorage.getItem("ai-chat-profile");
            if (!raw) return null;
            const p = JSON.parse(raw) as unknown;
            return p && typeof p === "object" && !Array.isArray(p) ? (p as Record<string, unknown>) : null;
        } catch {
            return null;
        }
    };

    // Ref so the transport closure always reads fresh settings
    const settingsRef = useRef(settings);
    settingsRef.current = settings;

    function stripProfilePictureFromResumeData(input: any) {
        if (!input || typeof input !== "object") return input;
        try {
            const cloned = structuredClone(input);
            if (cloned?.basicInfo && typeof cloned.basicInfo === "object") {
                delete (cloned.basicInfo as any).profilePicture;
            }
            return cloned;
        } catch {
            // Fallback shallow clone
            const basicInfo = input?.basicInfo && typeof input.basicInfo === "object" ? { ...(input.basicInfo as any) } : input?.basicInfo;
            if (basicInfo && typeof basicInfo === "object") delete (basicInfo as any).profilePicture;
            return { ...(input as any), basicInfo };
        }
    }

    // Get resumeData from localStorage to pass to /api/chat (strip heavy base64)
    const getResumeData = () => {
        if (typeof window === "undefined") return null;
        try {
            const raw = localStorage.getItem("resumeData");
            const parsed = raw ? JSON.parse(raw) : null;
            return stripProfilePictureFromResumeData(parsed);
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
                    contextText: useProfileContextRef.current
                        ? [settingsRef.current.contextWindow, buildProfileContextText()].filter(Boolean).join("\n\n")
                        : "",
                    resumeData: getResumeData(),
                    chatGlobalProfile: readChatGlobalProfile(),
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

    const lastMergedAssistantIdRef = useRef<string | null>(null);
    const prevChatStatusRef = useRef<typeof status>("ready");
    const [resumeApplyOfferId, setResumeApplyOfferId] = useState<string | null>(null);

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

    useEffect(() => {
        lastMergedAssistantIdRef.current = null;
        setResumeApplyOfferId(null);
    }, [currentSessionId]);

    useEffect(() => {
        const prev = prevChatStatusRef.current;
        const wasStreaming = prev === "streaming" || prev === "submitted";
        const nowIdle = status !== "streaming" && status !== "submitted";
        prevChatStatusRef.current = status;
        if (!wasStreaming || !nowIdle) return;

        const last = messages[messages.length - 1];
        if (!last || last.role !== "assistant" || !last.id) return;
        const text = getTextContent(last) ?? "";
        const { merged, template } = mergeAssistantResumeIntoCurrent(loadFullResumeFromStorage(), text);
        if (!merged) return;
        if (lastMergedAssistantIdRef.current === last.id) return;

        if (settings.autoMergeAssistantResume !== false) {
            lastMergedAssistantIdRef.current = last.id;
            localStorage.setItem("resumeData", JSON.stringify(merged));
            if (template) localStorage.setItem("resumeTemplate", template);
            showToast("success", "Resume merged from the assistant’s latest reply.");
            window.dispatchEvent(new CustomEvent("resume-storage-updated"));
            setResumeApplyOfferId(null);
        } else {
            setResumeApplyOfferId(last.id);
        }
    }, [status, messages, settings.autoMergeAssistantResume]);

    useEffect(() => {
        if (status === "submitted" || status === "streaming") setResumeApplyOfferId(null);
    }, [status]);

    const applyResumeFromOffer = useCallback(() => {
        const last = messages[messages.length - 1];
        if (!last || last.role !== "assistant") return;
        const text = getTextContent(last) ?? "";
        const { merged, template } = mergeAssistantResumeIntoCurrent(loadFullResumeFromStorage(), text);
        if (!merged) {
            showToast("error", "No resume JSON found in the last reply.");
            return;
        }
        lastMergedAssistantIdRef.current = last.id ?? null;
        localStorage.setItem("resumeData", JSON.stringify(merged));
        if (template) localStorage.setItem("resumeTemplate", template);
        setResumeApplyOfferId(null);
        showToast("success", "Resume saved. Your stored resume and exports use this data.");
        window.dispatchEvent(new CustomEvent("resume-storage-updated"));
    }, [messages]);

    const dismissResumeApplyOffer = useCallback(() => {
        const last = messages[messages.length - 1];
        if (last?.id) lastMergedAssistantIdRef.current = last.id;
        setResumeApplyOfferId(null);
    }, [messages]);

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

    const JOB_PROFILE_STORE_ID = "job-search-profile-store";

    const loadJobSearchProfile = (): {
        name: string;
        email: string;
        phone: string;
        location: string;
    } | null => {
        try {
            const raw = localStorage.getItem(JOB_PROFILE_STORE_ID);
            if (!raw) return null;
            return JSON.parse(raw) as {
                name: string;
                email: string;
                phone: string;
                location: string;
            };
        } catch {
            return null;
        }
    };

    const shouldScrapeJobsCommand = (text: string) => {
        const t = (text || "").toLowerCase();
        // Guardrails: job scraping must ONLY happen on explicit job-search intent.
        // This prevents intercepting prompts like "create me a resume..."
        if (/\b(resume|cv|cover\s*letter)\b/.test(t)) return false;

        // Explicit command still supported
        if (/^\s*\/jobs\b/.test(t) || /^\s*\/job\b/.test(t)) return true;

        // Natural language: require BOTH an action verb AND an explicit jobs token.
        const hasAction = /\b(find|search|look\s*for|looking\s*for|show\s*me|get\s*me|list)\b/.test(t);
        const hasJobsToken =
            /\b(jobs?|job\s*openings?|vacanc(?:y|ies)|opportunit(?:y|ies))\b/.test(t);

        return hasAction && hasJobsToken;
    };

    const getResumeQuery = (resumeData: any) => {
        try {
            const safe = sanitizeResumeData(resumeData);
            const title = safe.basicInfo?.title || "";
            const location = safe.basicInfo?.location || "";
            const skills = Array.isArray(safe.skills) ? safe.skills.slice(0, 8) : [];
            const summary = safe.basicInfo?.summary || "";
            return {
                query: [title, summary, skills.join(" ")].filter(Boolean).join(" ").trim() || "software engineer",
                location,
            };
        } catch {
            return { query: "software engineer", location: "" };
        }
    };

    const startJobScrape = useCallback(async () => {
        if (jobPanelLoading) return;

        const resumeData = getResumeData();
        if (!resumeData) {
            showToast("warning", "Generate your resume first (so we know your role + skills).");
            return;
        }

        const safeQuery = getResumeQuery(resumeData);
        const profile = loadJobSearchProfile();
        const location = profile?.location || safeQuery.location || "";
        const query = safeQuery.query;

        setJobPanelOpen(true);
        setJobPanelLoading(true);
        setJobPanelProgress(8);
        setJobPanelProgressLabel("Preparing your job search…");
        setJobPanelJobs([]);

        const steps = [
            { label: "Searching Google jobs…", pct: 35 },
            { label: "Filtering jobs posted within 5 minutes…", pct: 70 },
            { label: "Formatting suggestions…", pct: 88 },
        ];

        let cancelled = false;
        let stepIdx = 0;
        const stepTimer = window.setInterval(() => {
            if (cancelled) return;
            const next = steps[Math.min(stepIdx, steps.length - 1)];
            setJobPanelProgress((prev) => Math.max(prev, next.pct));
            setJobPanelProgressLabel(next.label);
            stepIdx += 1;
            if (stepIdx >= steps.length) window.clearInterval(stepTimer);
        }, 550);

        try {
            const res = await fetch("/api/job-search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query,
                    location,
                    maxResults: 30,
                    maxPostedMinutes: 5,
                    // Use the API key from the user's profile/settings (in-memory).
                    apiKey: settingsRef.current.apiKey || undefined,
                }),
            });

            if (!res.ok) throw new Error(`Job scrape failed (${res.status})`);
            const data = (await res.json()) as { jobs?: JobSuggestion[]; error?: string };

            const jobs = Array.isArray(data.jobs) ? data.jobs : [];
            if (!cancelled) {
                setJobPanelJobs(jobs);
                setJobPanelProgress(100);
                setJobPanelProgressLabel(jobs.length ? "Done" : "No recent jobs found");
                setJobPanelLoading(false);
            }
        } catch (e) {
            if (cancelled) return;
            setJobPanelJobs([]);
            setJobPanelProgress(100);
            setJobPanelProgressLabel("Could not fetch jobs");
            setJobPanelLoading(false);
            showToast("error", e instanceof Error ? e.message : "Failed to fetch jobs");
        } finally {
            cancelled = true;
            window.clearInterval(stepTimer);
        }
    }, [getResumeData, jobPanelLoading]);

    const handleUseJob = useCallback(
        async (job: JobSuggestion) => {
            setJobPanelOpen(false);
            setJobPanelJobs([]);
            setJobPanelLoading(false);
            setJobPanelProgress(0);

            const safeLink = job.link ? `\nJob link: ${job.link}` : "";
            const text = `Tailor my resume and draft a short application plan for this role:\n\nTitle: ${job.title}\nCompany: ${job.company}\nLocation: ${job.location}${safeLink}\n\nInclude relevant keywords and suggest a cover letter outline.`;

            sendMessage({ text });
        },
        [sendMessage]
    );

    const handleJobProfileSaved = useCallback(
        (profile: { name: string; email: string; phone: string; location: string }) => {
            try {
                const raw = localStorage.getItem("resumeData");
                const current = raw ? JSON.parse(raw) : {};
                const next = {
                    ...current,
                    basicInfo: {
                        ...(current.basicInfo || {}),
                        name: profile.name,
                        email: profile.email,
                        phone: profile.phone,
                        location: profile.location,
                    },
                };
                localStorage.setItem("resumeData", JSON.stringify(next));
            } catch {
                // ignore
            }
        },
        []
    );

    // If the user clicks “Apply Now” inside the job component,
    // trigger the same flow as “Use this job” from the panel.
    useEffect(() => {
        const handler = (ev: Event) => {
            const detail = (ev as CustomEvent<any>).detail;
            if (!detail) return;
            const job = detail as {
                title?: string;
                company?: string;
                location?: string;
                link?: string;
            };

            void handleUseJob({
                id: String(detail.id ?? ""),
                title: job.title ?? "Role",
                company: job.company ?? "Company",
                location: job.location ?? "Location not specified",
                link: job.link ?? "",
            } as JobSuggestion);
        };

        window.addEventListener("ai-chat:apply-job", handler);
        return () => window.removeEventListener("ai-chat:apply-job", handler);
    }, [handleUseJob]);

    const handleSend = useCallback(async () => {
        const trimmed = input.trim();
        if (!trimmed && attachedFiles.length === 0) return;

        // If user explicitly asks for jobs, show scraped results instead of chatting.
        if (shouldScrapeJobsCommand(trimmed) && getResumeData()) {
            setInput("");
            setAttachedFiles([]);
            void startJobScrape();
            return;
        }

        let text = input.trim();
        if (attachedFiles.length > 0) {
            text = text ? `${text}\n\n[Attached files: ${attachedFiles.map((f) => f.name).join(", ")}]` : `[Attached files: ${attachedFiles.map((f) => f.name).join(", ")}]`;
        }

        setInput("");
        setAttachedFiles([]);
        sendMessage({ text });
    }, [input, attachedFiles, sendMessage, startJobScrape]);

    // NOTE: We intentionally do NOT auto-open job suggestions after CV generation.
    // Jobs should appear only when the user explicitly asks for them.

    const handlePrompt = useCallback((p: string) => {
        setInput(p);
        // tiny delay so input state updates before send
        setTimeout(() => {
            sendMessage({ text: p });
            setInput("");
        }, 50);
    }, [sendMessage]);

    const handleExport = () => {
        const safeJsonParse = (raw: string | null) => {
            if (!raw) return null;
            try { return JSON.parse(raw); } catch { return null; }
        };

        const storedSessions = safeJsonParse(typeof window !== "undefined" ? localStorage.getItem("chat_sessions") : null);
        const sessionsToExport: any[] = Array.isArray(storedSessions) ? storedSessions : (Array.isArray(sessions) ? sessions : []);

        const messagesBySessionId: Record<string, unknown> = {};
        for (const s of sessionsToExport) {
            const sid = String((s as any)?.id ?? "");
            if (!sid) continue;
            const storedMsgs = safeJsonParse(localStorage.getItem(`chat_messages_${sid}`));
            if (Array.isArray(storedMsgs)) {
                messagesBySessionId[sid] = storedMsgs;
            } else if (sid === currentSessionId) {
                messagesBySessionId[sid] = messages;
            }
        }

        const profile = safeJsonParse(localStorage.getItem("ai-chat-profile"));
        const storedSettings = safeJsonParse(localStorage.getItem("ai-chat-settings"));
        const settingsToExport =
            storedSettings && typeof storedSettings === "object"
                ? (() => {
                    const { apiKey: _apiKey, ...rest } = storedSettings as any;
                    return rest;
                })()
                : { model: settings.model, contextWindow: settings.contextWindow };

        const resumeData = safeJsonParse(localStorage.getItem("resumeData"));

        const payload = {
            schema: "ai-career-assistant-export",
            version: 1,
            exportedAt: Date.now(),
            currentSessionId,
            sessions: sessionsToExport,
            messagesBySessionId,
            profile,
            settings: settingsToExport,
            resumeData,
        };

        const json = JSON.stringify(payload, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ai-career-assistant-${Date.now()}.json`;
        a.click();
        showToast("success", "Exported profile + settings + all sessions");
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const parsed = JSON.parse(ev.target?.result as string);

                // Back-compat: older exports were `{ messages: [...] }`
                if (parsed && typeof parsed === "object" && Array.isArray((parsed as any).messages)) {
                    const imported = (parsed as any).messages;
                    if (Array.isArray(imported) && (imported.length === 0 || imported[0]?.role)) {
                        setMessages(imported);
                        if (currentSessionId) {
                            localStorage.setItem(`chat_messages_${currentSessionId}`, JSON.stringify(imported));
                        }
                        showToast("success", "Imported current chat messages");
                        return;
                    }
                }

                // New "export everything" format
                if ((parsed as any)?.schema === "ai-career-assistant-export") {
                    const importedSessions = Array.isArray((parsed as any).sessions) ? (parsed as any).sessions : [];
                    const importedMessagesById =
                        (parsed as any).messagesBySessionId && typeof (parsed as any).messagesBySessionId === "object"
                            ? (parsed as any).messagesBySessionId
                            : {};
                    const importedProfile = (parsed as any).profile;
                    const importedSettings = (parsed as any).settings;
                    const importedResumeData = (parsed as any).resumeData;

                    localStorage.setItem("chat_sessions", JSON.stringify(importedSessions));
                    for (const s of importedSessions) {
                        const sid = String((s as any)?.id ?? "");
                        if (!sid) continue;
                        const msgs = (importedMessagesById as any)[sid];
                        if (Array.isArray(msgs)) {
                            localStorage.setItem(`chat_messages_${sid}`, JSON.stringify(msgs));
                        }
                    }

                    if (importedProfile && typeof importedProfile === "object") {
                        localStorage.setItem("ai-chat-profile", JSON.stringify(importedProfile));
                    }

                    if (importedSettings && typeof importedSettings === "object") {
                        const { apiKey: _apiKey, ...rest } = importedSettings as any;
                        localStorage.setItem("ai-chat-settings", JSON.stringify(rest));
                        updateSettings({ ...rest, apiKey: "" });
                    }

                    if (importedResumeData && typeof importedResumeData === "object") {
                        localStorage.setItem("resumeData", JSON.stringify(importedResumeData));
                    }

                    setSessions(importedSessions);
                    const nextCurrentId =
                        typeof (parsed as any).currentSessionId === "string" && (parsed as any).currentSessionId
                            ? (parsed as any).currentSessionId
                            : importedSessions[0]?.id || "default";
                    setCurrentSessionId(nextCurrentId);

                    const nextMsgs = localStorage.getItem(`chat_messages_${nextCurrentId}`);
                    if (nextMsgs) {
                        try { setMessages(JSON.parse(nextMsgs)); } catch { setMessages([]); }
                    } else {
                        setMessages([]);
                    }

                    showToast("success", "Imported profile + settings + all sessions");
                    return;
                }

                showToast("error", "Invalid import file");
            } catch {
                showToast("error", "Invalid session file");
            }
        };
        reader.readAsText(file);
        e.target.value = "";
    };

    const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        setAttachedFiles((prev) => [...prev, ...files]);
        showToast("success", `${files.length} file(s) attached`);
    };

    return (
        <InfiniteGridBackground className="fixed inset-0 h-[100dvh] max-h-[100dvh]">
            <div className="relative z-[1] flex h-full min-h-0 w-full flex-col">
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

            {/* Chat area — flex-1 keeps input pinned; scroll only messages */}
            <div
                ref={scrollRef}
                className="relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-y-contain pb-40 pt-16 sm:pb-44"
                style={{ scrollbarWidth: "thin" }}
            >
                <div className="mx-auto w-full max-w-4xl px-3 sm:px-5">
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

            {resumeApplyOfferId && !jobPanelOpen && (
                <div className="pointer-events-none fixed inset-x-0 bottom-[5.75rem] z-[36] flex justify-center px-3 sm:bottom-[6.25rem]">
                    <div className="pointer-events-auto flex w-full max-w-lg items-center gap-2 rounded-2xl border border-primary/35 bg-background/95 px-3 py-2.5 shadow-2xl backdrop-blur-xl dark:border-primary/25 dark:bg-[#0c0c10]/95 sm:gap-3 sm:px-4">
                        <Sparkles className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                        <p className="min-w-0 flex-1 text-left text-[11px] leading-snug text-muted-foreground sm:text-xs">
                            This reply includes resume JSON. Apply it to your saved resume (used across the app)?
                        </p>
                        <Button type="button" size="sm" className="h-8 shrink-0 text-xs" onClick={applyResumeFromOffer}>
                            Apply
                        </Button>
                        <Button type="button" size="sm" variant="ghost" className="h-8 shrink-0 text-xs" onClick={dismissResumeApplyOffer}>
                            Dismiss
                        </Button>
                    </div>
                </div>
            )}

            {/* Input bar (replaced by job suggestions when scraping) */}
            {jobPanelOpen ? (
                <JobSuggestionsPanel
                    jobs={jobPanelJobs}
                    open={jobPanelOpen}
                    loading={jobPanelLoading}
                    progress={jobPanelProgress}
                    progressLabel={jobPanelProgressLabel}
                    onClose={() => {
                        setJobPanelOpen(false);
                        setJobPanelLoading(false);
                    }}
                    onUseJob={(job) => void handleUseJob(job)}
                    resumeData={getResumeData()}
                    jobProfileOpen={jobProfileDialogOpen}
                    onJobProfileOpenChange={setJobProfileDialogOpen}
                    onJobProfileSaved={handleJobProfileSaved}
                />
            ) : (
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
                    useProfileContext={useProfileContext}
                    onToggleProfileContext={() => setUseProfileContext((v) => !v)}
                />
            )}
            </div>
        </InfiniteGridBackground>
    );
}
