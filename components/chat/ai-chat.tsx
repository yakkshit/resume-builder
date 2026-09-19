"use client";

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
    BookMarked,
    Search,
    Settings2,
    Lock,
    Clapperboard,
    Check,
    BarChart3,
    Globe,
    Target,
    Cpu,
    Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import Toaster, { ToasterRef } from '@/components/ui/toast';
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { InfiniteGridBackground } from "@/components/ui/the-infinite-grid";
import dynamic from "next/dynamic";

import { MarkdownRenderer } from "./markdown-renderer";
import { ComponentRenderer } from "./component-renderer";
import { UserMenu } from "@/components/auth/user-menu";
import { useChatSettings, ChatMessage, AVAILABLE_MODELS, type ChatSettings } from "./chat-store";
import {
    HF_CUSTOM_HUB_MODEL_ID,
    OPENAI_COMPAT_CHAT_MODEL_ID,
    isHuggingFaceCustomHubModel,
    isOpenAiCompatibleChatModel,
    needsHuggingFaceCustomModelField,
} from "@/lib/chat-provider-settings";
import { getTextContent, getReasoningContent, isReasoningStreaming } from "@/lib/message-utils";
import { Reasoning, ReasoningTrigger, ReasoningContent } from "@/components/ai-elements/reasoning";
import { Persona } from "@/components/ai-elements/persona";
import type { JobSuggestion } from "@/lib/job-scraper/google-jobs";
import { sanitizeResumeData, mergeResumeDataWithDefault } from "@/lib/sanitize-resume-data";
import { stripIncompleteJsonTail, parseChainOfThought, type ParsedToolCall } from "@/lib/streaming-chat-content";
import { mergeAssistantResumeIntoCurrent, extractResumeJsonFromMessage } from "@/lib/extract-resume-json";
import { normalizeResumePayloadToFlat } from "@/lib/normalize-sections-resume";
import { buildResumeDataForChatRequest, messagesForResumeContext } from "@/lib/chat-resume-context";
import { sanitizeCoverLetterData, extractCoverLetterJsonFromMessage } from "@/lib/sanitize-cover-letter-data";
import { buildUserKnowledgeStoreChunks } from "@/lib/user-knowledge-context";
import { DEFAULT_TRANSLATION_LANGUAGE } from "@/lib/translation";
import type { ResumeData } from "@/lib/types";
import { tryLocalStorageGet, tryLocalStorageSet, tryLocalStorageRemove } from "@/lib/safe-local-storage";
import { chatTextareaHeightPx } from "@/lib/chat-textarea";
import { ShineBorder } from "@/components/ui/shine-border";
import { ModelProviderIcon } from "@/lib/model-provider-icon";
import { Plug } from "lucide-react";
import { GitHubSyncService } from "@/lib/github/sync";
import { getStoredProfile, ProfileSettingsDialog } from "./profile-settings-dialog";
import { useAuth } from "@/lib/auth/auth-provider";

import { ChatFeedback } from "./chat-feedback";
import { ChromiumWebview } from "./chromium-webview";
import { ComponentStage, type StageComponentInfo } from "./components/component-stage";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

const panelLoading = () => (
    <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
        Loading...
    </div>
);

const ChatSidebar = dynamic(() => import("./sidebar").then((m) => m.ChatSidebar), { loading: panelLoading });
const JobSuggestionsPanel = dynamic(
    () => import("./job-suggestions-panel").then((m) => m.JobSuggestionsPanel),
    { loading: panelLoading },
);
const ChatOnboarding = dynamic(() => import("./chat-onboarding").then((m) => m.ChatOnboarding), {
    loading: panelLoading,
});
const MCPDialog = dynamic(() => import("./mcp-dialog").then((m) => m.MCPDialog), {
    loading: panelLoading,
});

// ── Welcome Screen ─────────────────────────────────────────────────────────

const ACTION_PILLS = [
    { label: "Create", icon: FileText, prompt: "Help me create and show my resume" },
    { label: "Explore", icon: Briefcase, prompt: "Find job recommendations for me" },
    { label: "Code", icon: Code, prompt: "Give me a coding challenge" },
    { label: "Learn", icon: BookOpen, prompt: "Recommend learning resources for me" },
];

const CHAT_INPUT_SHINE_LS = "ai-chat-input-shine-seen";

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
    const t = rawType.toLowerCase().replace(/_/g, "-");
    if (t === "cv" || t === "resume") return "resume";
    if (t === "coverletter" || t === "cover-letter" || t === "cover" || t === "coverletters" || t === "cover-letters") return "cover-letter";
    if (t === "cvscorer" || t === "cv-score" || t === "cvscore") return "cv-score";
    if (t === "joblinks" || t === "job-recommendations" || t === "jobrecommendations") return "job-recommendations";
    if (t === "jobscraper" || t === "job-scraper" || t === "jobsearch" || t === "job-search") return "job-scraper";
    if (t === "chart" || t === "recharts" || t === "analytics" || t === "graph") return "chart";
    if (t === "jobapplysimulator" || t === "auto-applier" || t === "autoapplier") return "auto-applier";
    if (t === "course" || t === "learning-resources" || t === "learningresources") return "learning-resources";
    if (t === "codingchallenge" || t === "coding-challenge") return "coding-challenge";
    if (t === "emailhr" || t === "email-hr" || t === "hr-email") return "email-hr";
    if (t === "linkedindm" || t === "linkedin-dm" || t === "linkedin") return "linkedin-dm";
    if (t === "resumelatex" || t === "resume-latex" || t === "latexcv") return "resume-latex";
    if (t === "coverletterlatex" || t === "cover-letter-latex" || t === "latexcover") return "cover-letter-latex";
    if (t === "browser" || t === "browser-controller" || t === "chromium" || t === "mcp-browser") return "browser";
    return null;
}

function extractComponents(text: string) {
    const componentRegex = /```component:([a-zA-Z0-9-_]+)\s*([\s\S]*?)(?:```|$)/gi;
    const components: { type: Parameters<typeof ComponentRenderer>[0]["type"] | null, data: any, isComplete: boolean }[] = [];
    let usedResumeJsonFallback = false;

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
            const resolvedType = mapComponentType(typeStr);

            // Normalize flat resume JSON or odd envelopes into { resumeData } for ResumeViewer
            if (resolvedType === "resume" && parsedData && typeof parsedData === "object") {
                const rec = parsedData as Record<string, unknown>;
                if (rec.resumeData && typeof rec.resumeData === "object") {
                    const rd = rec.resumeData as Record<string, unknown>;
                    const flat = normalizeResumePayloadToFlat(rd);
                    if (flat) {
                        parsedData = {
                            ...rec,
                            resumeData: flat,
                        };
                    }
                } else if (!rec.resumeData) {
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

            // Normalize cover letter payload into { coverLetterData, template } for CoverLetterViewer
            if (resolvedType === "cover-letter" && parsedData && typeof parsedData === "object") {
                const rec = parsedData as Record<string, unknown>;
                const sanitized = sanitizeCoverLetterData(rec.coverLetterData ?? rec.coverLetter ?? rec.data ?? rec);
                parsedData = {
                    ...rec,
                    coverLetterData: sanitized,
                    template: typeof rec.template === "string" ? rec.template : "modern",
                };
            }
        }

        components.push({
            type: mapComponentType(typeStr),
            data: parsedData,
            isComplete,
        });

        cleanText = cleanText.replace(rawMatch, "");
    }

    // Fallback 1: if model returned resume JSON (no component fence), still render Resume tool/PDF.
    const hasExplicitResumeComponent = components.some((c) => c.type === "resume");
    if (!hasExplicitResumeComponent) {
        const fallbackResume = extractResumeJsonFromMessage(text);
        if (fallbackResume) {
            const flat = normalizeResumePayloadToFlat(fallbackResume) ?? fallbackResume;
            usedResumeJsonFallback = true;
            components.push({
                type: "resume",
                data: { resumeData: flat },
                isComplete: true,
            });
            // Clean the JSON code fence out of cleanText so the chat bubble shows clean text instead of the huge raw JSON block
            cleanText = cleanText
                .replace(/```(?:json|cv|resume)?\s*\{[\s\S]*?\}\s*```/gi, "")
                .trim();
            if (!cleanText) {
                cleanText = "Here is your customized resume based on your profile:";
            }
        }
    }

    // Fallback 2: if model returned cover letter JSON (no component fence), render Cover Letter PDF.
    const hasExplicitCoverLetterComponent = components.some((c) => c.type === "cover-letter");
    if (!hasExplicitCoverLetterComponent) {
        const fallbackCover = extractCoverLetterJsonFromMessage(text);
        if (fallbackCover) {
            components.push({
                type: "cover-letter",
                data: { coverLetterData: fallbackCover, template: "modern" },
                isComplete: true,
            });
            cleanText = cleanText
                .replace(/```(?:json|cover-letter|coverletter)?\s*\{[\s\S]*?\}\s*```/gi, "")
                .trim();
        }
    }

    return { cleanText: cleanText.trim(), components, usedResumeJsonFallback };
}

/** Latest *renderable* resume block: merges with shared storage only for this instance. */
function computeCanonicalResumeInstanceKey(messages: UIMessage[], isStreamingLastAssistant: boolean): string | null {
    for (let i = messages.length - 1; i >= 0; i--) {
        const m = messages[i];
        if (m.role !== "assistant") continue;
        const text = getTextContent(m) ?? "";
        const { components } = extractComponents(text);
        const streamingThis = isStreamingLastAssistant && i === messages.length - 1;
        for (let j = components.length - 1; j >= 0; j--) {
            const c = components[j];
            if (c?.type !== "resume") continue;
            if (!streamingThis || c.isComplete) {
                return `${m.id ?? "m"}-${j}`;
            }
        }
    }
    return null;
}

// ── Tool Execution Badges ──────────────────────────────────────────────────

function ToolExecutionBadges({
    tools,
    components,
    isStreaming,
}: {
    tools: Array<{ name: string; status?: string; args?: Record<string, any> }>;
    components: Array<{ type: Parameters<typeof ComponentRenderer>[0]["type"] | null; isComplete: boolean }>;
    isStreaming?: boolean;
}) {
    const allBadges: Array<{ id: string; label: string; icon: React.ComponentType<{ className?: string }>; active: boolean }> = [];

    for (const tool of tools) {
        const name = tool.name.toLowerCase();
        let label = `Tool: ${tool.name}`;
        let IconComponent = Wrench;
        if (name.includes("job") || name.includes("search")) {
            label = "Job Scraper & Search";
            IconComponent = Search;
        } else if (name.includes("github") || name.includes("sync")) {
            label = "GitHub Encrypted Sync";
            IconComponent = Code;
        } else if (name.includes("chart")) {
            label = "Chart Generator";
            IconComponent = BarChart3;
        } else if (name.includes("ats") || name.includes("scorer")) {
            label = "ATS Score Analyzer";
            IconComponent = Target;
        } else if (name.includes("pdf") || name.includes("resume")) {
            label = "Resume PDF Engine";
            IconComponent = FileText;
        } else if (name.includes("web") || name.includes("scrape")) {
            label = "Web Scraper";
            IconComponent = Globe;
        } else if (name.includes("neo4j") || name.includes("graph")) {
            label = "Neo4j Knowledge Graph";
            IconComponent = Cpu;
        }
        allBadges.push({
            id: `tool-${tool.name}`,
            label,
            icon: IconComponent,
            active: Boolean(isStreaming && tool.status === "active"),
        });
    }

    for (const comp of components) {
        if (!comp.type) continue;
        let label = "UI Component";
        let IconComponent = Sparkles;
        switch (comp.type) {
            case "resume":
                label = "CV Builder & Live PDF";
                IconComponent = FileText;
                break;
            case "cover-letter":
                label = "Cover Letter Generator";
                IconComponent = BookOpen;
                break;
            case "cv-score":
                label = "ATS Match Scorer";
                IconComponent = Target;
                break;
            case "job-scraper":
                label = "Live Job Scraper Card";
                IconComponent = Search;
                break;
            case "job-recommendations":
                label = "Job Match Recommendations";
                IconComponent = Briefcase;
                break;
            case "chart":
                label = "Interactive Analytics Chart";
                IconComponent = BarChart3;
                break;
            case "auto-applier":
                label = "Application Auto-Applier";
                IconComponent = Cpu;
                break;
            case "coding-challenge":
                label = "Coding Interview Challenge";
                IconComponent = Code;
                break;
            case "learning-resources":
                label = "Learning Pick & Courses";
                IconComponent = BookOpen;
                break;
            case "email-hr":
                label = "HR Outreach Email Draft";
                IconComponent = Send;
                break;
            case "linkedin-dm":
                label = "LinkedIn Direct Message";
                IconComponent = Briefcase;
                break;
            case "resume-latex":
            case "cover-letter-latex":
                label = "LaTeX Compiler Artifact";
                IconComponent = FileText;
                break;
        }
        if (!allBadges.some((b) => b.label === label)) {
            allBadges.push({
                id: `comp-${comp.type}`,
                label,
                icon: IconComponent,
                active: Boolean(isStreaming && !comp.isComplete),
            });
        }
    }

    if (allBadges.length === 0) return null;

    return (
        <div className="flex flex-wrap items-center gap-1.5 py-1">
            {allBadges.map((b) => {
                const Icon = b.icon;
                return (
                    <div
                        key={b.id}
                        className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all shadow-xs",
                            b.active
                                ? "border-sky-500/40 bg-sky-500/10 text-sky-300 animate-pulse"
                                : "border-white/10 bg-white/[0.04] text-muted-foreground hover:text-foreground hover:border-white/20"
                        )}
                    >
                        <Icon className={cn("w-3 h-3 shrink-0", b.active ? "text-sky-400" : "text-primary/70")} />
                        <span>{b.label}</span>
                        {b.active ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
                        ) : (
                            <Check className="w-3 h-3 text-emerald-400/80" />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ── Message Bubble ─────────────────────────────────────────────────────────

function MessageBubble({
    message,
    isStreaming,
    onReply,
    onToast,
    chatApiKey,
    chatModel,
    canonicalResumeKey,
    activeStageComponentId,
    onPopOutToSide,
    onDockToChat,
}: {
    message: UIMessage;
    isStreaming?: boolean;
    onReply: (text: string) => void;
    onToast: (variant: "default" | "success" | "error" | "warning", msg: string) => void;
    chatApiKey?: string;
    chatModel?: string;
    canonicalResumeKey: string | null;
    activeStageComponentId?: string | null;
    onPopOutToSide?: (opts: StageComponentInfo) => void;
    onDockToChat?: () => void;
}) {
    const isUser = message.role === "user";
    const [hovering, setHovering] = useState(false);
    const content = getTextContent(message) ?? "";

    const cotResult = useMemo(
        () => (!isUser ? parseChainOfThought(content, isStreaming) : null),
        [isUser, content, isStreaming]
    );

    const sdkReasoning = !isUser ? getReasoningContent(message) : "";
    const effectiveReasoning = sdkReasoning || cotResult?.thinkingText || "";
    const isReasoningActive = Boolean(
        isStreaming && (isReasoningStreaming(message) || cotResult?.isThinkingActive)
    );
    const showReasoning = !isUser && (effectiveReasoning.trim().length > 0 || isReasoningActive);

    const textToClean = cotResult?.cleanedContent ?? content;

    /** Stable reference when message text unchanged — avoids ResumeViewer re-running merge on every parent render. */
    const extracted = useMemo(
        () => (!isUser ? extractComponents(textToClean) : { cleanText: content, components: [], usedResumeJsonFallback: false }),
        [isUser, textToClean, content],
    );

    const renderedText = isUser ? content : extracted.cleanText;

    const fallbackToastShownRef = useRef(false);
    useEffect(() => {
        if (isUser) return;
        if (isStreaming) return;
        if (!extracted.usedResumeJsonFallback) return;
        if (fallbackToastShownRef.current) return;
        fallbackToastShownRef.current = true;
        onToast(
            "warning",
            "Assistant returned resume JSON without component:cv. A fallback rendered your resume/PDF, but this is format drift to monitor.",
        );
    }, [isUser, isStreaming, extracted.usedResumeJsonFallback, onToast]);

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
                <div className="flex-shrink-0 mt-0.5">
                    <Persona
                        state={isStreaming ? (isReasoningActive ? "thinking" : "speaking") : "idle"}
                        variant="obsidian"
                        className="size-8"
                    />
                </div>
            )}

            <div className={`flex flex-col gap-2 ${isUser ? "items-end" : "items-start"} ${isUser ? "max-w-[90%]" : "w-full max-w-[min(980px,calc(100%-3rem))]"}`}>
                {showReasoning ? (
                    <Reasoning
                        className="w-full max-w-[min(720px,calc(100%-3rem))]"
                        isStreaming={isReasoningActive}
                    >
                        <ReasoningTrigger />
                        <ReasoningContent>{effectiveReasoning || " "}</ReasoningContent>
                    </Reasoning>
                ) : null}

                {!isUser && ((cotResult?.tools && cotResult.tools.length > 0) || extracted.components.length > 0) ? (
                    <ToolExecutionBadges
                        tools={cotResult?.tools ?? []}
                        components={extracted.components}
                        isStreaming={isStreaming}
                    />
                ) : null}

                {/* Bubble */}
                <div
                    className={`relative px-4 py-3 rounded-2xl text-sm ${isUser
                        ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-tr-sm"
                        : "w-full bg-background border border-border/60 rounded-tl-sm [overflow-wrap:anywhere]"
                        }`}
                >
                    {isUser ? (
                        <p className="whitespace-pre-wrap leading-relaxed">{renderedText}</p>
                    ) : (
                        <MarkdownRenderer content={renderedText} />
                    )}
                    {isStreaming && (
                        <span className="inline-block w-2 h-4 ml-1 bg-current opacity-70 animate-pulse align-text-bottom" />
                    )}
                </div>

                {/* Inline dynamic components */}
                {extracted.components.map((c, idx) => {
                    const compId = `${message.id ?? "m"}-${idx}-${c.type}`;
                    return c.type && (!isStreaming || c.isComplete) && (
                        <div key={compId} className="w-full mt-2">
                            <ComponentRenderer
                                type={c.type}
                                data={c.data}
                                chatApiKey={chatApiKey}
                                chatModel={chatModel}
                                onSendMessage={onReply}
                                componentId={compId}
                                isSideActive={activeStageComponentId === compId}
                                onPopOutToSide={onPopOutToSide}
                                onDockToChat={onDockToChat}
                                resumeSyncsWithGlobal={
                                    c.type === "resume"
                                        ? `${message.id ?? "m"}-${idx}` === canonicalResumeKey
                                        : undefined
                                }
                            />
                        </div>
                    );
                })}

                {/* Non-overlapping Footer Action Bar: Model Training Feedback + Copy + Quote */}
                {!isUser && !isStreaming && (
                    <div className="flex items-center justify-between w-full mt-1 px-1 text-xs text-muted-foreground gap-2">
                        <ChatFeedback
                            messageId={message.id || `msg_${Date.now()}`}
                            prompt={content}
                            response={content}
                            onFeedbackSubmitted={() => onToast("success", "Feedback saved for model training!")}
                        />
                        <div className="flex items-center gap-1">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        type="button"
                                        onClick={copy}
                                        aria-label="Copy message"
                                        className="p-1.5 rounded-lg border border-border/50 bg-background/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-all shadow-xs"
                                    >
                                        <Copy className="w-3.5 h-3.5" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="text-xs">Copy response</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        type="button"
                                        onClick={() => onReply(content)}
                                        aria-label="Quote in reply"
                                        className="p-1.5 rounded-lg border border-border/50 bg-background/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-all shadow-xs"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="text-xs">Quote in input</TooltipContent>
                            </Tooltip>
                        </div>
                    </div>
                )}
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

const QUICK_PROMPTS: {
    emoji: string;
    label: string;
    prompt: string;
    disabled?: boolean;
    tooltip?: string;
}[] = [
    { emoji: "📄", label: "Resume", prompt: "Show me and edit my resume" },
    { emoji: "✉️", label: "Email HR", prompt: "Help me email HR about a job application and show the email composer" },
    {
        emoji: "💼",
        label: "LinkedIn",
        prompt:
            "Write a LinkedIn connection or job-poster message under 200 characters and show the linkedinDm component so I can copy it",
    },
    { emoji: "⚡", label: "CV Score", prompt: "Analyze my CV score" },
    { emoji: "🔍", label: "Job Scraper", prompt: "Search and scrape live job postings for Frontend / Full Stack developer roles and match my resume" },
    { emoji: "🤖", label: "Auto-apply", prompt: "Start auto-applying to jobs" },
    { emoji: "💻", label: "Code", prompt: "Give me a coding challenge" },
    {
        emoji: "🛠️",
        label: "MCP Tools",
        prompt: "List available MCP tools and describe how you can help me generate documents and scrape jobs",
    },
    {
        emoji: "📐",
        label: "LaTeX CV",
        prompt:
            'I want a specific print style: give me both JSON resume updates if needed AND ```component:resumeLatex\n{"latex":"..."}\n``` with a full compilable LaTeX CV. If I also need a cover letter in LaTeX, add ```component:coverLetterLatex\n{"latex":"..."}\n```. Keep JSON valid.',
    },
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
    composerShine,
    onClearComposerShine,
    settings,
    onSettingsChange,
    raiseForOnboarding,
    showToast,
    onOpenMcpDialog,
    inSplitPanel,
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
    composerShine?: boolean;
    onClearComposerShine?: () => void;
    settings: ChatSettings;
    onSettingsChange: (patch: Partial<ChatSettings>) => void;
    raiseForOnboarding?: boolean;
    showToast: (variant: "default" | "success" | "error" | "warning", msg: string) => void;
    onOpenMcpDialog?: () => void;
    inSplitPanel?: boolean;
}) {
    const fileRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [modelMenuOpen, setModelMenuOpen] = useState(false);
    const [modelQuery, setModelQuery] = useState("");
    const [ingestingVault, setIngestingVault] = useState(false);
    const [vaultAddedFiles, setVaultAddedFiles] = useState<Record<string, boolean>>({});

    useLayoutEffect(() => {
        const ta = textareaRef.current;
        if (!ta) return;
        ta.style.height = "0px";
        ta.style.height = `${chatTextareaHeightPx(ta.scrollHeight, value)}px`;
    }, [value]);

    const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            onSend();
        }
    };

    const selectedModel = AVAILABLE_MODELS.find((m) => m.value === model);

    const filteredModels = useMemo(() => {
        const q = modelQuery.trim().toLowerCase();
        if (!q) return AVAILABLE_MODELS;
        return AVAILABLE_MODELS.filter(
            (m) =>
                m.label.toLowerCase().includes(q) ||
                m.provider.toLowerCase().includes(q) ||
                m.value.toLowerCase().includes(q),
        );
    }, [modelQuery]);

    const groupedModels = useMemo(() => {
        const map = new Map<string, typeof AVAILABLE_MODELS>();
        for (const m of filteredModels) {
            if (!map.has(m.provider)) map.set(m.provider, []);
            map.get(m.provider)!.push(m);
        }
        return map;
    }, [filteredModels]);

    const pickModel = (next: string) => {
        onModelChange(next);
        setModelMenuOpen(false);
        setModelQuery("");
    };

    const inputShell = (child: React.ReactNode) =>
        composerShine ? (
            <ShineBorder borderRadius={16} borderWidth={2} duration={12} color={["#a855f7", "#6366f1", "#22d3ee"]} className="w-full">
                {child}
            </ShineBorder>
        ) : (
            child
        );

    return (
        <div
            className={cn(
                inSplitPanel
                    ? "absolute bottom-3 left-0 right-0 z-30 w-full max-w-2xl mx-auto px-3 pointer-events-auto"
                    : "fixed bottom-5 left-1/2 z-30 w-full max-w-4xl -translate-x-1/2 px-4 pointer-events-auto",
                raiseForOnboarding && "z-[70]",
            )}
        >
            {/* Quick prompt chips */}
            {attachedFiles.length === 0 && (
                <div
                    data-chat-tour="quick-prompts"
                    className="flex items-center gap-1.5 mb-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth justify-start sm:justify-center px-1"
                >
                    {QUICK_PROMPTS.map((q) => {
                        const chip = (
                            <button
                                type="button"
                                key={q.label}
                                disabled={q.disabled}
                                onClick={() => {
                                    if (!q.disabled && q.prompt) onChange(q.prompt);
                                }}
                                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs transition-all shadow-sm ${
                                    q.disabled
                                        ? "opacity-50 cursor-not-allowed bg-muted/40 border-border/40"
                                        : "bg-background/90 backdrop-blur border-border/60 hover:border-foreground/30 hover:bg-muted"
                                }`}
                            >
                                <span>{q.emoji}</span>
                                <span className="text-muted-foreground">{q.label}</span>
                            </button>
                        );
                        if (q.disabled && q.tooltip) {
                            return (
                                <Tooltip key={q.label}>
                                    <TooltipTrigger asChild>
                                        <span className="inline-flex">{chip}</span>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-[220px] text-xs">
                                        {q.tooltip}
                                    </TooltipContent>
                                </Tooltip>
                            );
                        }
                        return (
                            <Tooltip key={q.label}>
                                <TooltipTrigger asChild>{chip}</TooltipTrigger>
                                <TooltipContent side="top" className="max-w-[260px] text-xs">
                                    {q.prompt || q.label}
                                </TooltipContent>
                            </Tooltip>
                        );
                    })}
                </div>
            )}

            {/* Attached files & Memory Vault Ingestion Prompt */}
            {attachedFiles.length > 0 && (
                <div className="space-y-2 mb-2">
                    <div className="flex flex-wrap items-center gap-2">
                        {attachedFiles.map((f, i) => (
                            <div key={i} className="flex items-center gap-1.5 bg-background/90 border border-border/60 rounded-lg px-2.5 py-1 text-xs shadow-sm">
                                <FileText className="w-3.5 h-3.5 text-primary" />
                                <span className="max-w-[130px] truncate font-medium">{f.name}</span>
                                {vaultAddedFiles[f.name] && (
                                    <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-0.5">
                                        <Check className="w-3 h-3" /> In Vault
                                    </span>
                                )}
                                <button onClick={() => onRemoveFile(i)} className="text-muted-foreground hover:text-destructive ml-1">
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-cyan-500/10 border border-indigo-500/20 backdrop-blur-md">
                        <div className="flex items-center gap-2 text-xs">
                            <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="text-muted-foreground">
                                Add {attachedFiles.length > 1 ? "these files" : attachedFiles[0].name} to your <strong className="text-foreground font-semibold">Memory Vault</strong>?
                            </span>
                        </div>
                        <Button
                            type="button"
                            size="sm"
                            disabled={ingestingVault}
                            onClick={async () => {
                                setIngestingVault(true);
                                try {
                                    const { parseAndIngestFileToMemoryVault } = await import("@/lib/memory-vault");
                                    for (const f of attachedFiles) {
                                        const res = await parseAndIngestFileToMemoryVault(f);
                                        if (res.success) {
                                            setVaultAddedFiles((prev) => ({ ...prev, [f.name]: true }));
                                            showToast("success", `Added ${f.name} to your Memory Vault!`);
                                        } else {
                                            showToast("warning", `Could not parse ${f.name}: ${res.error || "unknown"}`);
                                        }
                                    }
                                } catch {
                                    showToast("error", "Failed to add document to Memory Vault");
                                } finally {
                                    setIngestingVault(false);
                                }
                            }}
                            className="h-7 text-xs px-2.5 font-semibold bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white shadow-sm"
                        >
                            {ingestingVault ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                            Yes, Add to Vault
                        </Button>
                    </div>
                </div>
            )}

            {/* Input container */}
            {inputShell(
                <div className="flex items-end gap-1.5 sm:gap-2 bg-background/95 backdrop-blur-xl border-2 border-border/60 focus-within:border-foreground/30 rounded-2xl px-2 py-2 sm:px-3 shadow-xl transition-all">
                {/* Model: compact provider logo → popover (models + API key) + side sheets */}
                <Popover
                    open={modelMenuOpen}
                    onOpenChange={(o) => {
                        setModelMenuOpen(o);
                        if (!o) setModelQuery("");
                    }}
                >
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <PopoverTrigger asChild>
                                <button
                                    type="button"
                                    data-chat-tour="model-select"
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-muted/70 text-foreground ring-offset-background transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:ring-offset-2"
                                    aria-label={`Model: ${selectedModel?.label ?? model}. Click to switch model.`}
                                    aria-expanded={modelMenuOpen}
                                >
                                    {selectedModel?.provider ? (
                                        <ModelProviderIcon provider={selectedModel.provider} size={18} className="opacity-95" />
                                    ) : (
                                        <span className="text-[10px] font-medium text-muted-foreground">?</span>
                                    )}
                                </button>
                            </PopoverTrigger>
                        </TooltipTrigger>
                        <TooltipContent
                            side="top"
                            className="max-w-[min(92vw,280px)] border border-border/80 bg-popover px-3 py-2 text-sm leading-snug text-popover-foreground shadow-lg"
                        >
                            Model: {selectedModel?.label ?? model}. Click to switch AI models.
                        </TooltipContent>
                    </Tooltip>
                    <PopoverContent
                        align="start"
                        side="top"
                        sideOffset={10}
                        collisionPadding={12}
                        className="z-[85] w-[min(94vw,22rem)] border-border/80 bg-popover p-0 shadow-xl"
                        onOpenAutoFocus={(e) => e.preventDefault()}
                    >
                        <div className="border-b border-border/60 p-2.5">
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={modelQuery}
                                    onChange={(e) => setModelQuery(e.target.value)}
                                    placeholder="Search models…"
                                    className="h-9 rounded-lg border-border/60 bg-background/80 pl-8 text-xs"
                                />
                            </div>
                        </div>
                        <ScrollArea className="h-[min(50vh,300px)]">
                            <div className="p-1.5">
                                {filteredModels.length === 0 ? (
                                    <p className="px-2 py-6 text-center text-xs text-muted-foreground">No models match.</p>
                                ) : (
                                    Array.from(groupedModels.entries()).map(([provider, models]) => (
                                        <div key={provider} className="mb-2 last:mb-0">
                                            <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                                {provider}
                                            </p>
                                            <div className="space-y-0.5">
                                                {models.map((m) => (
                                                    <button
                                                        key={m.value}
                                                        type="button"
                                                        onClick={() => pickModel(m.value)}
                                                        className={cn(
                                                            "flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left text-xs transition-colors hover:bg-muted/80",
                                                            m.value === model ? "bg-muted font-medium" : "",
                                                        )}
                                                    >
                                                        <ModelProviderIcon
                                                            provider={m.provider}
                                                            size={14}
                                                            className="mt-0.5 shrink-0 opacity-90"
                                                        />
                                                        <span className="min-w-0 flex-1 leading-snug">{m.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </PopoverContent>
                </Popover>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <textarea
                            data-chat-tour="composer"
                            ref={textareaRef}
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            onKeyDown={handleKey}
                            onFocus={() => onClearComposerShine?.()}
                            placeholder="Ask me anything about your career…"
                            rows={1}
                            aria-label="Chat message"
                            className="flex-1 bg-transparent resize-none outline-none text-sm placeholder:text-muted-foreground py-1.5 leading-relaxed max-h-[180px] overflow-y-auto min-h-[40px]"
                            style={{ scrollbarWidth: "none" }}
                        />
                    </TooltipTrigger>
                    <TooltipContent
                        side="top"
                        className="max-w-[min(92vw,300px)] border border-border/80 bg-popover px-3 py-2 text-sm leading-snug text-popover-foreground shadow-lg"
                    >
                        Press Cmd+Enter (or Ctrl+Enter) to send, Enter for a new line.
                    </TooltipContent>
                </Tooltip>

                {/* Attach + send */}
                <div className="flex items-center gap-1 flex-shrink-0">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                data-chat-tour="profile-toggle"
                                type="button"
                                onClick={onToggleProfileContext}
                                className={`p-2 rounded-xl transition-all ${
                                    useProfileContext
                                        ? "text-foreground bg-muted"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                }`}
                                aria-pressed={useProfileContext}
                                aria-label="Toggle global profile and knowledge context"
                            >
                                <User className="w-4 h-4" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent
                            side="top"
                            className="max-w-[min(92vw,320px)] border border-border/80 bg-popover px-3 py-2 text-sm leading-snug text-popover-foreground shadow-lg"
                        >
                            {useProfileContext
                                ? "Global profile is ON. Your name, email, career notes, and saved resume chunks are included in what the model sees."
                                : "Global profile is OFF. Only the context text from Profile & Settings is sent—your stored profile fields are not added automatically."}
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                onClick={() => fileRef.current?.click()}
                                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                                aria-label="Attach files"
                            >
                                <Paperclip className="w-4 h-4" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                            Attach PDF, DOCX, images, or text (max per browser limits).
                        </TooltipContent>
                    </Tooltip>
                    <input
                        ref={fileRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={onFileAttach}
                        accept=".pdf,.doc,.docx,.txt,.png,.jpg,.json,.csv"
                    />
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                onClick={onSend}
                                disabled={(!value.trim() && attachedFiles.length === 0) || disabled}
                                className="p-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-80 disabled:opacity-30 transition-all"
                                aria-label="Send message"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                            Send message to the assistant
                        </TooltipContent>
                    </Tooltip>
                </div>
                </div>,
            )}
        </div>
    );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function AICareerAssistantChat() {
    const { settings, updateSettings } = useChatSettings();
    const { user, setIncognitoMode } = useAuth();
    const [input, setInput] = useState("");
    const [onboardingOpen, setOnboardingOpen] = useState(false);
    const [composerShine, setComposerShine] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mcpDialogOpen, setMcpDialogOpen] = useState(false);
    const [webviewOpen, setWebviewOpen] = useState(false);
    const [webviewSplitMode, setWebviewSplitMode] = useState<"horizontal" | "vertical" | "fullscreen">("horizontal");
    const [activeStageComponent, setActiveStageComponent] = useState<StageComponentInfo | null>(null);
    const [activeSideTab, setActiveSideTab] = useState<"webview" | "stage">("stage");
    const isSplitLayout = webviewOpen || activeStageComponent !== null;
    const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
    const [jobPanelOpen, setJobPanelOpen] = useState(false);
    const [jobPanelLoading, setJobPanelLoading] = useState(false);
    const [jobPanelProgress, setJobPanelProgress] = useState(0);
    const [jobPanelProgressLabel, setJobPanelProgressLabel] = useState("Searching Google jobs...");
    const [jobPanelJobs, setJobPanelJobs] = useState<JobSuggestion[]>([]);
    const [jobProfileDialogOpen, setJobProfileDialogOpen] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const handleInjectWebviewSnippet = useCallback((snippet: string, _sourceUrl?: string) => {
        setInput((prev) => {
            const prefix = prev.trim() ? `${prev}\n\n` : "";
            return `${prefix}${snippet}`;
        });
        showToast("success", "Selected web snippet added to chat composer.");
    }, []);
    const PROFILE_CONTEXT_TOGGLE_ID = "ai-chat-use-profile-context";
    const MAX_RETRIEVAL_MESSAGES = 80;
    const MAX_RETRIEVAL_SNIPPETS = 6;
    const MAX_RETRIEVAL_SNIPPET_CHARS = 500;
    const MAX_MEMORY_PROFILE_LINES = 12;
    const MAX_MEMORY_PROFILE_VALUE_CHARS = 240;
    const MAX_MEMORY_USER_TURNS = 8;
    const MAX_MEMORY_USER_TURN_CHARS = 360;
    const [useProfileContext, setUseProfileContext] = useState(true);
    const useProfileContextRef = useRef(true);
    useProfileContextRef.current = useProfileContext;

    useEffect(() => {
        if (typeof window === "undefined") return;
        if (tryLocalStorageGet(CHAT_INPUT_SHINE_LS) === "1") return;
        setComposerShine(true);
    }, []);

    const clearComposerShine = useCallback(() => {
        setComposerShine((v) => {
            if (!v) return v;
            tryLocalStorageSet(CHAT_INPUT_SHINE_LS, "1");
            return false;
        });
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const raw = tryLocalStorageGet(PROFILE_CONTEXT_TOGGLE_ID);
        if (raw === "false") setUseProfileContext(false);
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;
        tryLocalStorageSet(PROFILE_CONTEXT_TOGGLE_ID, useProfileContext ? "true" : "false");
    }, [useProfileContext]);

    const buildProfileContextText = () => {
        if (typeof window === "undefined") return "";
        try {
            const raw = tryLocalStorageGet("ai-chat-profile");
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

    const tokenizeForRetrieval = (text: string): string[] => {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, " ")
            .split(/\s+/)
            .filter((t) => t.length >= 3);
    };

    const trimForPrompt = (text: string, maxChars: number): string => {
        const t = (text || "").trim();
        if (!t) return "";
        return t.length > maxChars ? `${t.slice(0, maxChars)}…` : t;
    };

    const buildRetrievalContextFromMessages = (messages: UIMessage[]): string => {
        if (!messages.length) return "";
        const latestUser = [...messages].reverse().find((m) => m.role === "user");
        const latestText = latestUser ? (getTextContent(latestUser) ?? "") : "";
        const queryTokens = new Set(tokenizeForRetrieval(latestText));
        if (!queryTokens.size) return "";

        // Keep retrieval fast on long histories.
        const candidates = messages.slice(-MAX_RETRIEVAL_MESSAGES);
        const scored = candidates
            .map((m, index) => {
                const text = (getTextContent(m) ?? "").trim();
                if (!text) return null;
                const tokens = tokenizeForRetrieval(text);
                if (!tokens.length) return null;
                let score = 0;
                for (const t of tokens) {
                    if (queryTokens.has(t)) score += 1;
                }
                if (score === 0) return null;
                return { score, index, role: m.role, text };
            })
            .filter((x): x is NonNullable<typeof x> => Boolean(x))
            .sort((a, b) => (b.score - a.score) || (b.index - a.index))
            .slice(0, MAX_RETRIEVAL_SNIPPETS)
            .sort((a, b) => a.index - b.index);

        if (!scored.length) return "";
        return scored
            .map((s, i) => `${i + 1}. [${s.role}] ${trimForPrompt(s.text, MAX_RETRIEVAL_SNIPPET_CHARS)}`)
            .join("\n");
    };

    const buildMemoryContextText = (messages: UIMessage[]): string => {
        const profile = readChatGlobalProfile();
        const profileLines = profile
            ? Object.entries(profile)
                  .map(([k, v]) => {
                      if (typeof v !== "string") return "";
                      const trimmed = trimForPrompt(v, MAX_MEMORY_PROFILE_VALUE_CHARS);
                      return trimmed ? `${k}: ${trimmed}` : "";
                  })
                  .filter(Boolean)
                  .slice(0, MAX_MEMORY_PROFILE_LINES)
            : [];

        const recentUserTurns = [...messages]
            .filter((m) => m.role === "user")
            .slice(-MAX_MEMORY_USER_TURNS)
            .map((m, i) => `${i + 1}. ${trimForPrompt(getTextContent(m) ?? "", MAX_MEMORY_USER_TURN_CHARS)}`);

        const memoryBlocks: string[] = [];
        if (profileLines.length) memoryBlocks.push(`Profile memory:\n${profileLines.join("\n")}`);
        if (recentUserTurns.length) memoryBlocks.push(`Recent user intents:\n${recentUserTurns.join("\n")}`);
        return memoryBlocks.join("\n\n");
    };

    const makeAssistantMessageId = () =>
        `assistant_job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    function loadFullResumeFromStorage(): ResumeData {
        if (typeof window === "undefined") return mergeResumeDataWithDefault(null);
        try {
            const raw = tryLocalStorageGet("resumeData");
            return mergeResumeDataWithDefault(raw ? JSON.parse(raw) : null);
        } catch {
            return mergeResumeDataWithDefault(null);
        }
    }

    const readChatGlobalProfile = (): Record<string, unknown> | null => {
        if (typeof window === "undefined") return null;
        try {
            const raw = tryLocalStorageGet("ai-chat-profile");
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
            const raw = tryLocalStorageGet("resumeData");
            const parsed = raw ? JSON.parse(raw) : null;
            return stripProfilePictureFromResumeData(parsed);
        } catch { return null; }
    };

    const getResumeLatexForChat = () => {
        if (typeof window === "undefined") return "";
        try {
            const raw = tryLocalStorageGet("chatResumeLatex")?.trim();
            if (!raw) return "";
            return raw.length > 200_000 ? raw.slice(0, 200_000) : raw;
        } catch {
            return "";
        }
    };

    const getCoverLetterLatexForChat = () => {
        if (typeof window === "undefined") return "";
        try {
            const raw = tryLocalStorageGet("chatCoverLetterLatex")?.trim();
            if (!raw) return "";
            return raw.length > 200_000 ? raw.slice(0, 200_000) : raw;
        } catch {
            return "";
        }
    };

    const toasterRef = useRef<ToasterRef>(null);
    const [profileSettingsOpen, setProfileSettingsOpen] = useState(false);
    const [showScrollButton, setShowScrollButton] = useState(false);
    
    const showToast = (variant: 'default' | 'success' | 'error' | 'warning', msg: string) => {
        toasterRef.current?.show({
            title: variant.charAt(0).toUpperCase() + variant.slice(1),
            message: msg,
            variant,
            position: 'bottom-right',
        });
    };

    useEffect(() => {
        const onProfileUpdated = () => {
            showToast("success", "Global profile saved. AI context refreshed for upcoming responses.");
        };
        window.addEventListener("ai-chat-profile-updated", onProfileUpdated as EventListener);
        return () => window.removeEventListener("ai-chat-profile-updated", onProfileUpdated as EventListener);
    }, []);

    // Wire up real AI SDK → /api/chat
    const { messages, sendMessage, status, error, stop, setMessages } = useChat({
        transport: new DefaultChatTransport({
            api: "/api/chat",
            prepareSendMessagesRequest: ({ messages, id }) => {
                const mid = settingsRef.current.model;
                const openAiCompat = mid === OPENAI_COMPAT_CHAT_MODEL_ID;
                const hfCustom = !openAiCompat && mid === HF_CUSTOM_HUB_MODEL_ID;
                const hfHub = openAiCompat
                    ? {}
                    : hfCustom
                      ? { customModel: settingsRef.current.huggingFaceCustomModel?.trim() || undefined }
                      : needsHuggingFaceCustomModelField(mid) && settingsRef.current.huggingFaceCustomModel?.trim()
                        ? { customModel: settingsRef.current.huggingFaceCustomModel.trim() }
                        : {};
                const chatProfile = useProfileContextRef.current ? readChatGlobalProfile() : null;
                const requestResumeData = stripProfilePictureFromResumeData(
                    buildResumeDataForChatRequest(messagesForResumeContext(messages), getResumeData()),
                );
                const knowledgeContext = useProfileContextRef.current
                    ? buildUserKnowledgeStoreChunks(requestResumeData, chatProfile)
                    : "";
                return {
                body: {
                    messages,
                    id,
                    model: mid,
                    apiKey: settingsRef.current.apiKey,
                    ...(openAiCompat
                        ? {
                              customEndpoint: settingsRef.current.openAiCompatBaseUrl || undefined,
                              customModel: settingsRef.current.openAiCompatModel || undefined,
                          }
                        : hfHub),
                    contextText: useProfileContextRef.current
                        ? [settingsRef.current.contextWindow, buildProfileContextText()].filter(Boolean).join("\n\n")
                        : "",
                    memoryContext: useProfileContextRef.current ? buildMemoryContextText(messages) : "",
                    retrievalContext: [knowledgeContext, buildRetrievalContextFromMessages(messages)].filter(Boolean).join("\n\n"),
                    preferredLanguage: settingsRef.current.defaultLanguage || DEFAULT_TRANSLATION_LANGUAGE,
                    resumeData: requestResumeData,
                    resumeLatex: getResumeLatexForChat(),
                    coverLetterLatex: getCoverLetterLatexForChat(),
                    chatGlobalProfile: chatProfile,
                    aiMode: true,
                    mode: "career-assistant",
                },
            };
            },
        }),
        onError: (err) => {
            console.error("Chat error:", err);
            const msg = (err?.message ?? "").toLowerCase();
            if (msg.includes("invalid model") || msg.includes("not configured")) {
                showToast("warning", "This chat model is not supported or is misconfigured. Pick another model in the composer.");
                return;
            }
            if (
                msg.includes("422") ||
                msg.includes("incompatible") ||
                msg.includes("unsupported") ||
                msg.includes("model_not_found")
            ) {
                showToast(
                    "warning",
                    "The provider rejected this model or request. Switch to Google Gemini (or another supported model) and try again.",
                );
                return;
            }
            showToast("error", `AI error: ${err.message?.slice(0, 80) ?? "Unknown error"}`);
        },
    });

    const lastMergedAssistantIdRef = useRef<string | null>(null);
    const resumeCvHintShownForAssistantIdRef = useRef<string | null>(null);
    const prevChatStatusRef = useRef<typeof status>("ready");
    const [resumeApplyOfferId, setResumeApplyOfferId] = useState<string | null>(null);

    // History sessions management
    const [sessions, setSessions] = useState<any[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string>("");

    useEffect(() => {
        const saved = tryLocalStorageGet("chat_sessions");
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
                tryLocalStorageSet("chat_sessions", JSON.stringify([defaultSession]));
                setCurrentSessionId("default");
            }
        } else {
            const defaultSession = { id: "default", title: "New Chat", createdAt: Date.now(), updatedAt: Date.now() };
            setSessions([defaultSession]);
            tryLocalStorageSet("chat_sessions", JSON.stringify([defaultSession]));
            setCurrentSessionId("default");
        }
    }, []);

    // Cross-Device Restoration: Fetch and decrypt past chat sessions and resumes from GitHub
    const hasRestoredFromCloudRef = useRef(false);
    useEffect(() => {
        const p = getStoredProfile();
        const ghToken = user.githubToken || p.githubToken;
        const ghOwner = user.githubUsername || p.github;
        const ghRepo = user.githubRepo || p.githubRepo;
        const passphrase = user.encryptionPassphrase;

        if (user.isOnboarded && ghToken && ghOwner && ghRepo && !hasRestoredFromCloudRef.current) {
            hasRestoredFromCloudRef.current = true;
            GitHubSyncService.fetchAllEncryptedChatSessions(
                { token: ghToken, owner: ghOwner, repo: ghRepo },
                passphrase
            ).then((remoteSessions) => {
                if (remoteSessions && remoteSessions.length > 0) {
                    const formatted = remoteSessions.map((rs: any) => ({
                        id: rs.id || `session_${Date.now()}`,
                        title: rs.title || "Restored Chat",
                        createdAt: rs.createdAt || Date.now(),
                        updatedAt: rs.updatedAt || Date.now(),
                    }));
                    setSessions((prev) => {
                        const map = new Map();
                        for (const s of prev) map.set(s.id, s);
                        for (const s of formatted) map.set(s.id, s);
                        const merged = Array.from(map.values());
                        tryLocalStorageSet("chat_sessions", JSON.stringify(merged));
                        return merged;
                    });
                    remoteSessions.forEach((rs: any) => {
                        if (rs.messages && rs.id) {
                            tryLocalStorageSet(`chat_messages_${rs.id}`, JSON.stringify(rs.messages));
                        }
                    });
                    if (formatted.length > 0) {
                        setCurrentSessionId(formatted[0].id);
                    }
                    showToast("success", `Restored ${remoteSessions.length} encrypted chat session(s) from GitHub.`);
                }
            }).catch(() => { /* silent */ });
        }
    }, [user.isOnboarded, user.githubToken, user.githubUsername, user.githubRepo, user.encryptionPassphrase, showToast]);

    // When currentSessionId changes, load its messages
    useEffect(() => {
        if (!currentSessionId) return;
        const savedMsg = tryLocalStorageGet(`chat_messages_${currentSessionId}`);
        if (savedMsg) {
            setMessages(JSON.parse(savedMsg));
        } else {
            setMessages([]);
        }
    }, [currentSessionId, setMessages]);

    // When messages change, save them and update session title based on user message
    useEffect(() => {
        if (!currentSessionId) return;
        if (messages.length > 0) {
            tryLocalStorageSet(`chat_messages_${currentSessionId}`, JSON.stringify(messages));

            setSessions((prev) => {
                const next = [...prev];
                const idx = next.findIndex(s => s.id === currentSessionId);
                if (idx !== -1) {
                    const firstUser = messages.find(m => m.role === "user");
                    const userText = firstUser ? getTextContent(firstUser)?.trim() : "";
                    const title = userText ? (userText.length > 35 ? `${userText.slice(0, 35)}…` : userText) : "New Chat";
                    next[idx] = { ...next[idx], title, updatedAt: Date.now() };
                    tryLocalStorageSet("chat_sessions", JSON.stringify(next));
                }
                return next;
            });
        }
    }, [messages, currentSessionId]);

    useEffect(() => {
        lastMergedAssistantIdRef.current = null;
        resumeCvHintShownForAssistantIdRef.current = null;
        setResumeApplyOfferId(null);
    }, [currentSessionId]);

    useEffect(() => {
        const prev = prevChatStatusRef.current;
        const wasStreaming = prev === "streaming" || prev === "submitted";
        const nowIdle = status !== "streaming" && status !== "submitted";
        prevChatStatusRef.current = status;

        const last = messages[messages.length - 1];
        if (!last || last.role !== "assistant" || !last.id) return;
        const text = getTextContent(last) ?? "";

        // Hint only once per assistant message, right when stream finishes
        if (wasStreaming && nowIdle) {
            // Auto-sync chat session to GitHub repository (Zero-Knowledge Encrypted) if configured
            const p = getStoredProfile();
            const ghToken = user.githubToken || p.githubToken;
            const ghOwner = user.githubUsername || p.github;
            const ghRepo = user.githubRepo || p.githubRepo;
            const passphrase = user.encryptionPassphrase;

            if (ghToken && ghOwner && ghRepo) {
                const sessionMessages = messages.map((m) => ({
                    role: m.role,
                    content: getTextContent(m) ?? "",
                }));
                GitHubSyncService.syncEncryptedChatSession(
                    { token: ghToken, owner: ghOwner, repo: ghRepo },
                    currentSessionId || "default",
                    `Chat ${new Date().toLocaleDateString()}`,
                    sessionMessages,
                    passphrase
                ).catch(() => { /* silent background sync */ });
            }

            if (resumeCvHintShownForAssistantIdRef.current !== last.id) {
                let lastUser = "";
                for (let i = messages.length - 2; i >= 0; i--) {
                    if (messages[i]?.role === "user") {
                        lastUser = getTextContent(messages[i]!) ?? "";
                        break;
                    }
                }
                const resumeIntent =
                    /\b(resume|cv|curriculum|latex cv|cover letter|cover-letter|experience|summary|skills)\b/i.test(
                        lastUser,
                    );
                const hasCvFence =
                    /```\s*component\s*:\s*(cv|resume)\b/i.test(text) ||
                    extractResumeJsonFromMessage(text) != null;
                const modelId = settingsRef.current.model ?? "";
                const gemini = modelId.startsWith("gemini-");
                if (resumeIntent && lastUser.length > 12 && !hasCvFence && !gemini) {
                    resumeCvHintShownForAssistantIdRef.current = last.id;
                    showToast(
                        "warning",
                        "This reply did not include structured resume JSON (```component:cv```). Google Gemini usually follows this format most reliably — try switching models.",
                    );
                }
            }
        }

        // Merge while idle whenever the last assistant message gains parseable resume JSON.
        if (status === "streaming" || status === "submitted") return;

        const { merged, template } = mergeAssistantResumeIntoCurrent(loadFullResumeFromStorage(), text);
        if (!merged) return;
        if (lastMergedAssistantIdRef.current === last.id) return;

        if (settings.autoMergeAssistantResume !== false) {
            lastMergedAssistantIdRef.current = last.id;
            tryLocalStorageSet("resumeData", JSON.stringify(merged));
            if (template) tryLocalStorageSet("resumeTemplate", template);
            showToast("success", "Resume merged from the assistant’s latest reply.");
            window.dispatchEvent(new CustomEvent("resume-storage-updated"));
            setResumeApplyOfferId(null);

            // Auto-persist resume to PostgreSQL database for authenticated users (unless in incognito)
            if (!user.isIncognito) {
                fetch("/api/user/resumes", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        title: (merged as any)?.basicInfo?.name ? `${(merged as any).basicInfo.name}'s Resume` : "My Resume",
                        template: template || "modern",
                        data: merged,
                    }),
                }).catch(() => { /* offline / anonymous */ });
            }

            // Auto-sync resume to user's private GitHub repository (Zero-Knowledge Encrypted)
            const p = getStoredProfile();
            const ghToken = user.githubToken || p.githubToken;
            const ghOwner = user.githubUsername || p.github;
            const ghRepo = user.githubRepo || p.githubRepo;
            const passphrase = user.encryptionPassphrase;

            if (ghToken && ghOwner && ghRepo) {
                GitHubSyncService.syncEncryptedResume(
                    { token: ghToken, owner: ghOwner, repo: ghRepo },
                    (merged as any)?.basicInfo?.name ? `${(merged as any).basicInfo.name}-Resume` : "Resume",
                    merged as unknown as Record<string, unknown>,
                    passphrase
                ).catch(() => { /* silent */ });
            }
        } else {
            setResumeApplyOfferId(last.id);
        }
    }, [status, messages, settings.autoMergeAssistantResume, currentSessionId]);

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
        tryLocalStorageSet("resumeData", JSON.stringify(merged));
        if (template) tryLocalStorageSet("resumeTemplate", template);
        setResumeApplyOfferId(null);
        showToast("success", "Resume saved. Your stored resume and exports use this data.");
        window.dispatchEvent(new CustomEvent("resume-storage-updated"));
    }, [messages]);

    const dismissResumeApplyOffer = useCallback(() => {
        const last = messages[messages.length - 1];
        if (last?.id) lastMergedAssistantIdRef.current = last.id;
        setResumeApplyOfferId(null);
    }, [messages]);

    const isAtBottomRef = useRef(true);

    const handleChatScroll = useCallback(() => {
        if (!scrollRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        // User is considered at bottom if within 120px of bottom
        const isAtBottom = scrollHeight - (scrollTop + clientHeight) < 120;
        isAtBottomRef.current = isAtBottom;
        setShowScrollButton(!isAtBottom);
    }, []);

    const handleNewSession = useCallback(() => {
        const id = Date.now().toString();
        const newSession = { id, title: "New Chat", createdAt: Date.now(), updatedAt: Date.now() };
        setSessions((prev) => {
            const next = [newSession, ...prev.filter((s) => s.id !== id)];
            tryLocalStorageSet("chat_sessions", JSON.stringify(next));
            return next;
        });
        setCurrentSessionId(id);
        setMessages([]);
        setInput("");
        setAttachedFiles([]);
        isAtBottomRef.current = true;
        if (scrollRef.current) {
            scrollRef.current.scrollTop = 0;
        }
    }, [setMessages]);

    const handleDeleteSession = (id: string) => {
        const nextSessions = sessions.filter((s) => s.id !== id);
        setSessions(nextSessions);
        tryLocalStorageSet("chat_sessions", JSON.stringify(nextSessions));
        tryLocalStorageRemove(`chat_messages_${id}`);
        if (currentSessionId === id) {
            if (nextSessions.length > 0) {
                setCurrentSessionId(nextSessions[0].id);
            } else {
                handleNewSession();
            }
        }
    };


    const isLoading = status === "streaming" || status === "submitted";

    const canonicalResumeKey = React.useMemo(() => {
        const streamingLast =
            isLoading && messages.length > 0 && messages[messages.length - 1]?.role === "assistant";
        return computeCanonicalResumeInstanceKey(messages, streamingLast);
    }, [messages, isLoading]);

    const showWelcome = messages.length === 0;

    // Scroll to bottom on new messages ONLY if user was already at the bottom
    useEffect(() => {
        if (scrollRef.current && isAtBottomRef.current) {
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
            const raw = tryLocalStorageGet(JOB_PROFILE_STORE_ID);
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
                const raw = tryLocalStorageGet("resumeData");
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
                tryLocalStorageSet("resumeData", JSON.stringify(next));
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

        const storedSessions = safeJsonParse(typeof window !== "undefined" ? tryLocalStorageGet("chat_sessions") : null);
        const sessionsToExport: any[] = Array.isArray(storedSessions) ? storedSessions : (Array.isArray(sessions) ? sessions : []);

        const messagesBySessionId: Record<string, unknown> = {};
        for (const s of sessionsToExport) {
            const sid = String((s as any)?.id ?? "");
            if (!sid) continue;
            const storedMsgs = safeJsonParse(tryLocalStorageGet(`chat_messages_${sid}`));
            if (Array.isArray(storedMsgs)) {
                messagesBySessionId[sid] = storedMsgs;
            } else if (sid === currentSessionId) {
                messagesBySessionId[sid] = messages;
            }
        }

        const profile = safeJsonParse(tryLocalStorageGet("ai-chat-profile"));
        const storedSettings = safeJsonParse(tryLocalStorageGet("ai-chat-settings"));
        const settingsToExport =
            storedSettings && typeof storedSettings === "object"
                ? (() => {
                    const {
                        apiKey: _apiKey,
                        vercelOidcToken: _vercel,
                        openaiTranscriptionApiKey: _openaiTx,
                        ...rest
                    } = storedSettings as Record<string, unknown>;
                    return rest;
                })()
                : {
                      model: settings.model,
                      contextWindow: settings.contextWindow,
                      autoMergeAssistantResume: settings.autoMergeAssistantResume,
                      openAiCompatBaseUrl: settings.openAiCompatBaseUrl,
                      openAiCompatModel: settings.openAiCompatModel,
                      huggingFaceCustomModel: settings.huggingFaceCustomModel,
                      integrationsDocsUrlOverride: settings.integrationsDocsUrlOverride,
                  };

        const resumeData = safeJsonParse(tryLocalStorageGet("resumeData"));

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
                            tryLocalStorageSet(`chat_messages_${currentSessionId}`, JSON.stringify(imported));
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

                    tryLocalStorageSet("chat_sessions", JSON.stringify(importedSessions));
                    for (const s of importedSessions) {
                        const sid = String((s as any)?.id ?? "");
                        if (!sid) continue;
                        const msgs = (importedMessagesById as any)[sid];
                        if (Array.isArray(msgs)) {
                            tryLocalStorageSet(`chat_messages_${sid}`, JSON.stringify(msgs));
                        }
                    }

                    if (importedProfile && typeof importedProfile === "object") {
                        tryLocalStorageSet("ai-chat-profile", JSON.stringify(importedProfile));
                    }

                    if (importedSettings && typeof importedSettings === "object") {
                        const {
                            apiKey: _apiKey,
                            vercelOidcToken: _vercel,
                            openaiTranscriptionApiKey: _openaiTx,
                            ...rest
                        } = importedSettings as Record<string, unknown>;
                        tryLocalStorageSet("ai-chat-settings", JSON.stringify(rest));
                        updateSettings({
                            ...(rest as Partial<ChatSettings>),
                            apiKey: "",
                            vercelOidcToken: "",
                            openaiTranscriptionApiKey: "",
                        });
                    }

                    if (importedResumeData && typeof importedResumeData === "object") {
                        tryLocalStorageSet("resumeData", JSON.stringify(importedResumeData));
                    }

                    setSessions(importedSessions);
                    const nextCurrentId =
                        typeof (parsed as any).currentSessionId === "string" && (parsed as any).currentSessionId
                            ? (parsed as any).currentSessionId
                            : importedSessions[0]?.id || "default";
                    setCurrentSessionId(nextCurrentId);

                    const nextMsgs = tryLocalStorageGet(`chat_messages_${nextCurrentId}`);
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
        <TooltipProvider delayDuration={7000}>
            <div className="relative z-[1] flex h-full min-h-0 w-full flex-row overflow-hidden">
            <ChatOnboarding open={onboardingOpen} onOpenChange={setOnboardingOpen} setSidebarOpen={setSidebarOpen} />
            <MCPDialog
                open={mcpDialogOpen}
                onOpenChange={setMcpDialogOpen}
            />
            <ProfileSettingsDialog
                open={profileSettingsOpen}
                onOpenChange={(v) => {
                    setProfileSettingsOpen(v);
                }}
                settings={settings}
                onSettingsChange={updateSettings}
            />
            <Toaster ref={toasterRef} />

            {/* Sidebar (Desktop Collapsible Rail / Expanded + Mobile Drawer) */}
            <ChatSidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                isCollapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                sessions={sessions}
                currentId={currentSessionId}
                settings={settings}
                onSessionSelect={(id) => { setCurrentSessionId(id); setSidebarOpen(false); }}
                onNewSession={() => { handleNewSession(); setSidebarOpen(false); }}
                onDeleteSession={handleDeleteSession}
                onExport={handleExport}
                onImport={handleImport}
                onSettingsChange={updateSettings}
                onIntegrationsToast={showToast}
                onOpenWebview={() => setWebviewOpen((v) => !v)}
                webviewOpen={webviewOpen}
                onOpenMcp={() => setMcpDialogOpen(true)}
                onOpenGuide={() => setOnboardingOpen(true)}
                onOpenSettings={() => setProfileSettingsOpen(true)}
            />

            {/* Main Content Column */}
            <div className="flex-1 flex flex-col h-full min-w-0 bg-[#161619]/90 relative overflow-hidden">
                {/* Mobile-only floating sidebar trigger */}
                <div className="md:hidden absolute top-3 left-3 z-30">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSidebarOpen(true)}
                        className="size-8 rounded-lg border border-white/10 bg-[#141416]/80 text-foreground backdrop-blur-md shadow-md"
                        aria-label="Open sidebar"
                        type="button"
                    >
                        <Menu className="size-4" />
                    </Button>
                </div>

                {/* Floating Stop generation button if generating */}
                {isLoading && (
                    <div className="absolute top-3 right-3 z-30">
                        <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={stop}
                            className="h-7 px-2.5 text-xs gap-1.5 rounded-full shadow-lg backdrop-blur-md"
                            aria-label="Stop generating"
                        >
                            <Loader2 className="size-3 animate-spin" />
                            <span>Stop</span>
                        </Button>
                    </div>
                )}

            {/* Error banner */}
            {error && (
                <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-destructive/10 border border-destructive/30 text-destructive rounded-xl px-4 py-2 text-xs shadow-lg">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{error.message?.slice(0, 120) ?? "An error occurred"}</span>
                </div>
            )}

            {/* Main Workspace Layout (Supports Split Webview / Component Stage + Chat) */}
            {isSplitLayout ? (
                <ResizablePanelGroup
                    direction={webviewSplitMode === "vertical" ? "vertical" : "horizontal"}
                    className="flex-1 h-full w-full min-h-0 z-10"
                >
                    {webviewSplitMode === "vertical" && (
                        <>
                            <ResizablePanel defaultSize={50} minSize={25} className="h-full relative">
                                {webviewOpen && activeStageComponent ? (
                                    <div className="flex flex-col h-full w-full bg-background overflow-hidden">
                                        <div className="flex items-center justify-between px-3 py-1.5 bg-muted/40 border-b border-border/60 shrink-0">
                                            <div className="flex items-center gap-1 bg-background/80 p-0.5 rounded-lg border border-border/50">
                                                <Button
                                                    type="button"
                                                    variant={activeSideTab === "webview" ? "secondary" : "ghost"}
                                                    size="sm"
                                                    onClick={() => setActiveSideTab("webview")}
                                                    className="h-6 px-2 text-xs gap-1.5 rounded-md"
                                                >
                                                    <Globe className="size-3" />
                                                    <span>Browser</span>
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant={activeSideTab === "stage" ? "secondary" : "ghost"}
                                                    size="sm"
                                                    onClick={() => setActiveSideTab("stage")}
                                                    className="h-6 px-2 text-xs gap-1.5 rounded-md"
                                                >
                                                    <Sparkles className="size-3" />
                                                    <span className="truncate max-w-[120px]">{activeStageComponent.title}</span>
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="flex-1 min-h-0 relative">
                                            {activeSideTab === "webview" ? (
                                                <ChromiumWebview
                                                    splitLayout={webviewSplitMode}
                                                    onToggleSplitLayout={setWebviewSplitMode}
                                                    onClose={() => setWebviewOpen(false)}
                                                    onInjectSnippet={handleInjectWebviewSnippet}
                                                />
                                            ) : (
                                                <ComponentStage
                                                    component={activeStageComponent}
                                                    onDockToChat={() => setActiveStageComponent(null)}
                                                    onClose={() => setActiveStageComponent(null)}
                                                    chatApiKey={settings.apiKey}
                                                    chatModel={settings.model}
                                                    canonicalResumeKey={canonicalResumeKey}
                                                    onSendMessage={handlePrompt}
                                                />
                                            )}
                                        </div>
                                    </div>
                                ) : activeStageComponent ? (
                                    <ComponentStage
                                        component={activeStageComponent}
                                        onDockToChat={() => setActiveStageComponent(null)}
                                        onClose={() => setActiveStageComponent(null)}
                                        chatApiKey={settings.apiKey}
                                        chatModel={settings.model}
                                        canonicalResumeKey={canonicalResumeKey}
                                        onSendMessage={handlePrompt}
                                    />
                                ) : (
                                    <ChromiumWebview
                                        splitLayout={webviewSplitMode}
                                        onToggleSplitLayout={setWebviewSplitMode}
                                        onClose={() => setWebviewOpen(false)}
                                        onInjectSnippet={handleInjectWebviewSnippet}
                                    />
                                )}
                            </ResizablePanel>
                            <ResizableHandle withHandle />
                        </>
                    )}

                    {/* Chat Column */}
                    <ResizablePanel defaultSize={50} minSize={30} className="flex flex-col relative h-full min-h-0 overflow-hidden">
                        <div
                            ref={scrollRef}
                            onScroll={handleChatScroll}
                            className="relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-y-contain pb-64 pt-4 sm:pb-72"
                            style={{ scrollbarWidth: "thin" }}
                        >
                            <div className="mx-auto w-full max-w-3xl px-3 sm:px-5">
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
                                                    chatApiKey={settings.apiKey}
                                                    chatModel={settings.model}
                                                    canonicalResumeKey={canonicalResumeKey}
                                                    activeStageComponentId={activeStageComponent?.id}
                                                    onPopOutToSide={(comp) => {
                                                        setActiveStageComponent(comp);
                                                        setActiveSideTab("stage");
                                                    }}
                                                    onDockToChat={() => setActiveStageComponent(null)}
                                                />
                                            ))}

                                            {/* Typing indicator while submitted */}
                                            <AnimatePresence>
                                                {status === "submitted" && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 8 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0 }}
                                                        className="flex gap-3"
                                                    >
                                                        <Persona state="thinking" variant="obsidian" className="size-8 flex-shrink-0" />
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
                            composerShine={composerShine}
                            onClearComposerShine={clearComposerShine}
                            settings={settings}
                            onSettingsChange={updateSettings}
                            raiseForOnboarding={onboardingOpen}
                            showToast={showToast}
                            onOpenMcpDialog={() => setMcpDialogOpen(true)}
                            inSplitPanel={true}
                        />
                    </ResizablePanel>

                    {webviewSplitMode === "horizontal" && (
                        <>
                            <ResizableHandle withHandle />
                            <ResizablePanel defaultSize={50} minSize={30} className="h-full relative">
                                {webviewOpen && activeStageComponent ? (
                                    <div className="flex flex-col h-full w-full bg-background overflow-hidden">
                                        <div className="flex items-center justify-between px-3 py-1.5 bg-muted/40 border-b border-border/60 shrink-0">
                                            <div className="flex items-center gap-1 bg-background/80 p-0.5 rounded-lg border border-border/50">
                                                <Button
                                                    type="button"
                                                    variant={activeSideTab === "webview" ? "secondary" : "ghost"}
                                                    size="sm"
                                                    onClick={() => setActiveSideTab("webview")}
                                                    className="h-6 px-2 text-xs gap-1.5 rounded-md"
                                                >
                                                    <Globe className="size-3" />
                                                    <span>Browser</span>
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant={activeSideTab === "stage" ? "secondary" : "ghost"}
                                                    size="sm"
                                                    onClick={() => setActiveSideTab("stage")}
                                                    className="h-6 px-2 text-xs gap-1.5 rounded-md"
                                                >
                                                    <Sparkles className="size-3" />
                                                    <span className="truncate max-w-[120px]">{activeStageComponent.title}</span>
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="flex-1 min-h-0 relative">
                                            {activeSideTab === "webview" ? (
                                                <ChromiumWebview
                                                    splitLayout={webviewSplitMode}
                                                    onToggleSplitLayout={setWebviewSplitMode}
                                                    onClose={() => setWebviewOpen(false)}
                                                    onInjectSnippet={handleInjectWebviewSnippet}
                                                />
                                            ) : (
                                                <ComponentStage
                                                    component={activeStageComponent}
                                                    onDockToChat={() => setActiveStageComponent(null)}
                                                    onClose={() => setActiveStageComponent(null)}
                                                    chatApiKey={settings.apiKey}
                                                    chatModel={settings.model}
                                                    canonicalResumeKey={canonicalResumeKey}
                                                    onSendMessage={handlePrompt}
                                                />
                                            )}
                                        </div>
                                    </div>
                                ) : activeStageComponent ? (
                                    <ComponentStage
                                        component={activeStageComponent}
                                        onDockToChat={() => setActiveStageComponent(null)}
                                        onClose={() => setActiveStageComponent(null)}
                                        chatApiKey={settings.apiKey}
                                        chatModel={settings.model}
                                        canonicalResumeKey={canonicalResumeKey}
                                        onSendMessage={handlePrompt}
                                    />
                                ) : (
                                    <ChromiumWebview
                                        splitLayout={webviewSplitMode}
                                        onToggleSplitLayout={setWebviewSplitMode}
                                        onClose={() => setWebviewOpen(false)}
                                        onInjectSnippet={handleInjectWebviewSnippet}
                                    />
                                )}
                            </ResizablePanel>
                        </>
                    )}
                </ResizablePanelGroup>
            ) : (
                /* Fullscreen Standard Chat */
                <>
                    <div
                        ref={scrollRef}
                        onScroll={handleChatScroll}
                        className="relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-y-contain pb-64 pt-4 sm:pb-72"
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
                                                chatApiKey={settings.apiKey}
                                                chatModel={settings.model}
                                                canonicalResumeKey={canonicalResumeKey}
                                                activeStageComponentId={null}
                                                onPopOutToSide={(comp) => {
                                                    setActiveStageComponent(comp);
                                                    setActiveSideTab("stage");
                                                }}
                                                onDockToChat={() => setActiveStageComponent(null)}
                                            />
                                        ))}

                                        {/* Typing indicator while submitted */}
                                        <AnimatePresence>
                                            {status === "submitted" && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 8 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0 }}
                                                    className="flex gap-3"
                                                >
                                                    <Persona state="thinking" variant="obsidian" className="size-8 flex-shrink-0" />
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
                        composerShine={composerShine}
                        onClearComposerShine={clearComposerShine}
                        settings={settings}
                        onSettingsChange={updateSettings}
                        raiseForOnboarding={onboardingOpen}
                        showToast={showToast}
                        onOpenMcpDialog={() => setMcpDialogOpen(true)}
                        inSplitPanel={false}
                    />
                </>
            )}

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


            </div>
        </div>
        </TooltipProvider>
    );
}
