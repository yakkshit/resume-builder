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
    ImageIcon,
    Clapperboard,
    Check,
    BarChart3,
    Globe,
    Target,
    Cpu,
    Wrench,
    Network,
    Layers,
    ArrowUp,
    ChevronDown,
    SlidersHorizontal,
    Plus,
    Square,
    ArrowDown,
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
import { useRouter } from "next/navigation";

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
import {
    ModelSelector,
    ModelSelectorTrigger,
    ModelSelectorContent,
    ModelSelectorInput,
    ModelSelectorList,
    ModelSelectorEmpty,
    ModelSelectorGroup,
    ModelSelectorItem,
    ModelSelectorLogo,
    ModelSelectorName,
    ModelCapabilityIcons,
    CapabilityFilterBar,
    CapabilityLegendDialog,
} from "@/components/ai-elements/model-selector";
import { type ModelCapabilityKey, hasModelCapability } from "@/lib/model-capabilities";
import {
    ToolSelector,
    ToolSelectorTrigger,
    ToolSelectorContent,
    ToolSelectorInput,
    ToolSelectorList,
    ToolSelectorEmpty,
    ToolSelectorGroup,
    ToolSelectorItem,
    ToolSelectorName,
    ToolSelectorDescription,
} from "@/components/ai-elements/tool-selector";
import { TopCornerControls } from "./top-corner-controls";
import { AnchorMessageScroller } from "./anchor-message-scroller";
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
import { chatTextareaHeightPx, CHAT_TEXTAREA_MIN_HEIGHT_PX } from "@/lib/chat-textarea";
import { ShineBorder } from "@/components/ui/shine-border";
import { ModelProviderIcon } from "@/lib/model-provider-icon";
import { Plug } from "lucide-react";
import { getStoredProfile, loadProviderKeys } from "./profile-settings-dialog";
import { SearchSourcesDrawer } from "./search-sources-drawer";
import type { WebSearchResult } from "@/lib/web-search";
import { useAuth } from "@/lib/auth/auth-provider";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

const panelLoading = () => (
    <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
        Loading...
    </div>
);

const ChatSidebar = dynamic(() => import("./sidebar").then((m) => m.ChatSidebar), { loading: panelLoading });
const ChatOnboarding = dynamic(() => import("./chat-onboarding").then((m) => m.ChatOnboarding), {
    loading: panelLoading,
});
const MCPDialog = dynamic(() => import("./mcp-dialog").then((m) => m.MCPDialog), {
    loading: panelLoading,
});
const ChatFeedback = dynamic(() => import("./chat-feedback").then((m) => m.ChatFeedback), {
    loading: panelLoading,
});
const ChromiumWebview = dynamic(() => import("./chromium-webview").then((m) => m.ChromiumWebview), {
    loading: panelLoading,
});
const ComponentStage = dynamic(
    () => import("./components/component-stage").then((m) => m.ComponentStage),
    { loading: panelLoading },
);
const ChatCommandPalette = dynamic(
    () => import("./command-palette").then((m) => m.ChatCommandPalette),
    { ssr: false }
);
import type { StageComponentInfo } from "./components/component-stage";

const CHAT_INPUT_SHINE_LS = "ai-chat-input-shine-seen";

const HERO_SUGGESTIONS = [
    { label: "Match live software jobs", prompt: "Find real-time software engineer and fullstack developer jobs matching my profile.", icon: Search },
    { label: "Score my ATS resume", prompt: "Score my resume against ATS standards and identify critical missing skills.", icon: Target },
    { label: "Explain system design problem", prompt: "Walk me through designing a high-throughput distributed URL shortener.", icon: Code },
    { label: "Generate LaTeX CV", prompt: "Generate a clean, high-grade LaTeX resume based on my career background.", icon: FileText },
    { label: "Draft recruiter outreach email", prompt: "Draft a personalized cold outreach email to an engineering hiring manager.", icon: Sparkles },
    { label: "Search salary benchmarks", prompt: "What are the latest salary compensation bands for senior fullstack engineers?", icon: Globe },
];

function WelcomeHero() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, filter: "blur(8px)" }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center justify-center pt-8 pb-5 px-4 text-center select-none"
        >
            <h1 className="text-2xl sm:text-[32px] font-medium tracking-tight text-neutral-200">
                What can I help with?
            </h1>
        </motion.div>
    );
}

const THINKING_LABELS = [
    "Thinking",
    "Searching career knowledge",
    "Analyzing resume details",
    "Composing recommendations",
];

function ThinkingIndicator() {
    const [labelIndex, setLabelIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setLabelIndex((prev) => (prev + 1) % THINKING_LABELS.length);
        }, 1300);
        return () => clearInterval(interval);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-3 py-2"
        >
            <div className="size-8 rounded-full bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center shrink-0">
                <Sparkles className="size-4 text-indigo-400 animate-pulse" />
            </div>
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-[#1e1e22]/90 border border-white/10 shadow-xl backdrop-blur-md">
                <AnimatePresence mode="wait">
                    <motion.span
                        key={labelIndex}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                        className="text-xs font-medium text-neutral-200 min-w-[70px]"
                    >
                        {THINKING_LABELS[labelIndex]}
                    </motion.span>
                </AnimatePresence>
                <span className="mo-dots text-indigo-400 flex items-center" aria-hidden="true">
                    <i /><i /><i />
                </span>
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
    if (t === "joblinks" || t === "job-recommendations" || t === "jobrecommendations" || t === "jobscraper" || t === "job-scraper" || t === "jobsearch" || t === "job-search") return "job-recommendations";
    if (t === "graph-rag" || t === "graphrag" || t === "neo4j" || t === "knowledge-graph" || t === "knowledgegraph" || t === "neo4j-graph") return "graph-rag";
    if (t === "vector-rag" || t === "vectorrag" || t === "langchain" || t === "langchain-rag" || t === "vector") return "vector-rag";
    if (t === "chart" || t === "recharts" || t === "analytics" || t === "graph") return "chart";
    if (t === "jobapplysimulator" || t === "auto-applier" || t === "autoapplier") return "auto-applier";
    if (t === "course" || t === "learning-resources" || t === "learningresources") return "learning-resources";
    if (t === "codingchallenge" || t === "coding-challenge") return "coding-challenge";
    if (t === "emailhr" || t === "email-hr" || t === "hr-email") return "email-hr";
    if (t === "linkedindm" || t === "linkedin-dm" || t === "linkedin") return "linkedin-dm";
    if (t === "resumelatex" || t === "resume-latex" || t === "latexcv") return "resume-latex";
    if (t === "coverletterlatex" || t === "cover-letter-latex" || t === "latexcover") return "cover-letter-latex";
    if (t === "image-generation" || t === "imagegeneration" || t === "image" || t === "generate-image" || t === "ai-image") return "image-generation";
    if (t === "browser" || t === "browser-controller" || t === "chromium" || t === "mcp-browser") return "browser";
    if (t === "search" || t === "searchresources" || t === "search-resources" || t === "sources" || t === "web-search") return "search-resources";
    if (t === "scraper-plan" || t === "scraperplan" || t === "webscraper" || t === "web-scraper" || t === "resilient-scraper") return "scraper-plan";
    return null;
}

export const AVAILABLE_CAREER_TOOLS = [
    {
        id: "web-search",
        name: "Live Web Search (Tavily & Firecrawl)",
        shortName: "Web Search",
        description: "Real-time AI search, scraping, and live factual grounding via Tavily and Firecrawl",
        category: "Live Grounding",
        icon: Globe,
        color: "text-teal-400",
        bgGradient: "from-teal-500/20 to-emerald-500/10 border-teal-500/30",
        promptSuggestion: "Search online developer profiles and hiring trends on GitHub and Hugging Face.",
    },
    {
        id: "job-scraper",
        name: "Job Scraper & Live Matching",
        shortName: "Job Scraper",
        description: "Search live developer jobs and scrape requirements",
        category: "Autonomous Agent",
        icon: Briefcase,
        color: "text-emerald-400",
        bgGradient: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30",
        promptSuggestion: "Find live software engineer jobs matching my profile.",
    },
    {
        id: "cv-score",
        name: "ATS Resume & CV Scorer",
        shortName: "ATS Scorer",
        description: "Analyze ATS match rate, missing keywords, and structural gaps",
        category: "Autonomous Agent",
        icon: Target,
        color: "text-amber-400",
        bgGradient: "from-amber-500/20 to-orange-500/10 border-amber-500/30",
        promptSuggestion: "Score my resume against ATS standards and identify missing keywords.",
    },
    {
        id: "latex-cv",
        name: "LaTeX CV Generator",
        shortName: "LaTeX CV",
        description: "Compile and render professional ATS-compliant LaTeX resume",
        category: "Document Creator",
        icon: FileText,
        color: "text-cyan-400",
        bgGradient: "from-cyan-500/20 to-blue-500/10 border-cyan-500/30",
        promptSuggestion: "Generate a clean professional LaTeX resume from my career background.",
    },
    {
        id: "auto-apply",
        name: "Auto-Apply Assistant",
        shortName: "Auto-Apply",
        description: "Simulate and automate job application form-filling",
        category: "Autonomous Agent",
        icon: Send,
        color: "text-blue-400",
        bgGradient: "from-blue-500/20 to-indigo-500/10 border-blue-500/30",
        promptSuggestion: "Start an auto-apply simulation for jobs matching my target roles.",
    },
    {
        id: "coding-challenge",
        name: "Coding Challenge Simulator",
        shortName: "Coding Challenge",
        description: "Interactive technical interview challenges with automated grading",
        category: "Career Prep",
        icon: Code,
        color: "text-orange-400",
        bgGradient: "from-orange-500/20 to-rose-500/10 border-orange-500/30",
        promptSuggestion: "Give me a technical coding challenge for a senior software engineer role.",
    },
    {
        id: "email-hr",
        name: "Recruiter Outreach & HR Email",
        shortName: "HR Email",
        description: "Draft personalized hiring manager emails & LinkedIn DMs",
        category: "Career Prep",
        icon: Sparkles,
        color: "text-pink-400",
        bgGradient: "from-pink-500/20 to-purple-500/10 border-pink-500/30",
        promptSuggestion: "Draft a personalized outreach email to a hiring manager.",
    },
    {
        id: "image-generation",
        name: "AI Image & Asset Synthesis",
        shortName: "Image Synthesis",
        description: "Generate synthetic neural visuals, landscape concepts, and portfolio assets",
        category: "Document Creator",
        icon: ImageIcon,
        color: "text-purple-400",
        bgGradient: "from-purple-500/25 via-pink-500/20 to-indigo-500/10 border-purple-500/40",
        promptSuggestion: "Generate an image of a calm mountain lake at dawn in 1024 × 1024 resolution.",
    },
];

export const FIXED_ALWAYS_ACTIVE_TOOLS = [] as const;
export const isFixedTool = (_toolId: string) => false;

const DATABASE_TOOL_PATTERNS = [
    /neo4j/i,
    /graph\s*rag/i,
    /graphical\s*rag/i,
    /vector\s*rag/i,
    /langchain/i,
    /memory\s*vault/i,
    /knowledge\s*vault/i,
    /database/i,
];

export function isDatabaseTool(nameOrId: string): boolean {
    if (!nameOrId) return false;
    return DATABASE_TOOL_PATTERNS.some((pattern) => pattern.test(nameOrId));
}

export interface ParsedUserMessage {
    cleanPrompt: string;
    activeToolIds: string[];
    attachedFiles: string[];
}

export function parseUserMessageContent(rawContent: string): ParsedUserMessage {
    if (!rawContent) return { cleanPrompt: "", activeToolIds: [], attachedFiles: [] };

    let text = rawContent;
    const foundToolNames: string[] = [];
    const attachedFiles: string[] = [];

    // 1. Extract [Active Tools: ...]
    const toolsRegex = /\[Active Tools:\s*([^\]]+)\]/gi;
    let match: RegExpExecArray | null;
    while ((match = toolsRegex.exec(rawContent)) !== null) {
        const listStr = match[1];
        if (listStr) {
            const names = listStr.split(/,\s*/);
            for (const n of names) {
                const trimmed = n.trim();
                if (trimmed && !isDatabaseTool(trimmed)) {
                    foundToolNames.push(trimmed);
                }
            }
        }
    }
    text = text.replace(toolsRegex, "");

    // 2. Extract [Attached files: ...]
    const filesRegex = /\[Attached files:\s*([^\]]+)\]/gi;
    while ((match = filesRegex.exec(rawContent)) !== null) {
        const fileNames = match[1];
        if (fileNames) {
            for (const f of fileNames.split(/,\s*/)) {
                const trimmed = f.trim();
                if (trimmed) attachedFiles.push(trimmed);
            }
        }
    }
    text = text.replace(filesRegex, "");

    // 3. Strip any system reminder tags if present
    text = text.replace(/\[SYSTEM REMINDER:[^\]]*\]/gi, "");
    text = text.replace(/\[MANDATORY:[^\]]*\]/gi, "");

    // 4. Map found tool names to tool IDs
    const activeToolIds: string[] = [];
    for (const name of foundToolNames) {
        const lower = name.toLowerCase();
        const matched = AVAILABLE_CAREER_TOOLS.find(
            (t) =>
                t.name.toLowerCase() === lower ||
                (t.shortName && t.shortName.toLowerCase() === lower) ||
                t.id.toLowerCase() === lower ||
                lower.includes(t.shortName.toLowerCase()) ||
                (t.category === "Live Grounding" && (lower.includes("web") || lower.includes("search"))) ||
                (t.id === "image-generation" && (lower.includes("image") || lower.includes("synthesis")))
        );
        if (matched && !activeToolIds.includes(matched.id)) {
            activeToolIds.push(matched.id);
        }
    }

    return {
        cleanPrompt: text.trim(),
        activeToolIds,
        attachedFiles,
    };
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

    // Clean any orphaned JSON tool/component leak lines from cleanText
    cleanText = cleanText
        .replace(/\{"query":[\s\S]*?"resultsCount":\d+[\s\S]*?"results":\[[\s\S]*?\]\}/g, "")
        .replace(/^(?:["\w\-./ ]*","(?:domain|url|title|snippet|favicon)":[\s\S]*?)(?:\n\n|\n(?=[A-Z#*`]))/gm, "")
        .trim();

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
        } else if (name.includes("neo4j") || name.includes("graph") || name.includes("vector") || name.includes("langchain")) {
            // Internal database/RAG grounding — keep invisible to user in frontend
            continue;
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
            case "graph-rag":
            case "vector-rag":
                // Internal database operations — keep invisible to user in frontend
                continue;
            case "image-generation":
                label = "AI Image Generation";
                IconComponent = ImageIcon;
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

    const userParsed = useMemo(
        () => (isUser ? parseUserMessageContent(content) : null),
        [isUser, content]
    );

    const userActiveTools = useMemo(() => {
        if (!isUser || !userParsed) return [];
        return userParsed.activeToolIds
            .map((id) => AVAILABLE_CAREER_TOOLS.find((t) => t.id === id))
            .filter((t): t is (typeof AVAILABLE_CAREER_TOOLS)[number] => Boolean(t));
    }, [isUser, userParsed]);

    const renderedText = isUser ? (userParsed?.cleanPrompt ?? content) : extracted.cleanText;

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
        navigator.clipboard.writeText(isUser ? (userParsed?.cleanPrompt ?? content) : content);
        onToast("success", "Copied to clipboard!");
    };

    return (
        <motion.div
            data-message-id={message.id}
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
                        variant="theme"
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

                {/* Top Search Resources Card (Matching Images 1 & 2) */}
                {!isUser && extracted.components.filter((c) => c.type === "search-resources").map((c, idx) => (
                    <div key={`sr-top-${idx}`} className="w-full mb-1">
                        <ComponentRenderer
                            type="search-resources"
                            data={c.data}
                            componentId={`sr-${message.id ?? "m"}-${idx}`}
                        />
                    </div>
                ))}

                {/* Bubble */}
                <div
                    className={cn(
                        "relative px-4 py-2.5 rounded-2xl text-sm transition-colors",
                        isUser
                            ? "bg-[#232328] text-neutral-100 border border-white/5 rounded-tr-md max-w-full font-normal shadow-sm"
                            : "w-full text-neutral-200 [overflow-wrap:anywhere] pt-1"
                    )}
                >
                    {isUser ? (
                        <div className="flex flex-col gap-1.5">
                            <p className="whitespace-pre-wrap leading-relaxed">{renderedText}</p>

                            {/* Attached files chips */}
                            {userParsed && userParsed.attachedFiles.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-0.5">
                                    {userParsed.attachedFiles.map((fn, idx) => (
                                        <span
                                            key={idx}
                                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs bg-white/5 border border-white/10 text-neutral-300"
                                        >
                                            <Paperclip className="size-3 text-neutral-400" />
                                            <span className="truncate max-w-[200px]">{fn}</span>
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Tool Logos / Badges positioned at bottom-right corner */}
                            {userActiveTools.length > 0 && (
                                <div className="flex items-center justify-end gap-1.5 pt-1.5 -mb-0.5 select-none self-end">
                                    {userActiveTools.map((tool) => {
                                        const ToolIcon = tool.icon;
                                        return (
                                            <Tooltip key={tool.id}>
                                                <TooltipTrigger asChild>
                                                    <div
                                                        className={cn(
                                                            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border shadow-xs transition-all cursor-default select-none",
                                                            "bg-white/[0.08] hover:bg-white/[0.14] border-white/15 text-neutral-200 backdrop-blur-xs"
                                                        )}
                                                    >
                                                        <ToolIcon className={cn("size-3.5 shrink-0", tool.color)} />
                                                        <span className="text-[10.5px] font-medium text-neutral-300 tracking-tight">
                                                            {tool.shortName || tool.name}
                                                        </span>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent
                                                    side="top"
                                                    align="end"
                                                    className="text-xs bg-[#18181b] border-white/10 text-neutral-200 shadow-xl max-w-xs p-2.5 rounded-xl z-50"
                                                >
                                                    <p className="font-semibold text-white flex items-center gap-1.5">
                                                        <ToolIcon className={cn("size-3.5", tool.color)} />
                                                        {tool.name}
                                                    </p>
                                                    <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                                                        {tool.description}
                                                    </p>
                                                </TooltipContent>
                                            </Tooltip>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ) : (
                        <MarkdownRenderer content={renderedText} />
                    )}
                    {isStreaming && (
                        <span className="inline-block w-2 h-4 ml-1 bg-current opacity-70 animate-pulse align-text-bottom" />
                    )}
                </div>

                {/* Inline dynamic components */}
                {extracted.components.filter((c) => c.type !== "search-resources").map((c, idx) => {
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
        </motion.div>
    );
}

// ── Input Bar ──────────────────────────────────────────────────────────────

const MINIMAL_SUGGESTIONS = [
    "Show me my resume and career profile",
    "Analyze my CV score against a job description",
    "Draft a personalized cover letter for my target role",
    "Practice technical mock interview questions with feedback",
    "Recommend top learning resources and skill roadmaps",
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
    isLoading,
    onStop,
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
    isCenterWelcome,
    activeTools = [],
    onToggleTool,
    onClearTools,
    onOpenProfileSettings,
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
    isLoading?: boolean;
    onStop?: () => void;
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
    isCenterWelcome?: boolean;
    activeTools?: string[];
    onToggleTool?: (toolId: string) => void;
    onClearTools?: () => void;
    onOpenProfileSettings?: () => void;
}) {
    const fileRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [modelMenuOpen, setModelMenuOpen] = useState(false);
    const [toolMenuOpen, setToolMenuOpen] = useState(false);
    const [plusMenuOpen, setPlusMenuOpen] = useState(false);
    const [modelQuery, setModelQuery] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const [ingestingVault, setIngestingVault] = useState(false);
    const [vaultAddedFiles, setVaultAddedFiles] = useState<Record<string, boolean>>({});

    useLayoutEffect(() => {
        const ta = textareaRef.current;
        if (!ta) return;
        if (!value || !value.trim()) {
            ta.style.height = `${CHAT_TEXTAREA_MIN_HEIGHT_PX}px`;
            return;
        }
        ta.style.height = "auto";
        ta.style.height = `${chatTextareaHeightPx(ta.scrollHeight, value)}px`;
    }, [value]);

    const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter") {
            if (!e.shiftKey || e.metaKey || e.ctrlKey) {
                e.preventDefault();
                if (isLoading && onStop) {
                    onStop();
                    return;
                }
                if (value.trim() || attachedFiles.length > 0) {
                    onSend();
                }
            }
        }
    };

    const [capabilityFilter, setCapabilityFilter] = useState<ModelCapabilityKey | "all">("all");

    const selectedModel = AVAILABLE_MODELS.find((m) => m.value === model);

    const groupedModels = useMemo(() => {
        const map = new Map<string, typeof AVAILABLE_MODELS>();
        for (const m of AVAILABLE_MODELS) {
            if (capabilityFilter !== "all" && !hasModelCapability(m.value, capabilityFilter)) {
                continue;
            }
            const list = map.get(m.provider) || [];
            list.push(m);
            map.set(m.provider, list);
        }
        return Array.from(map.entries()).map(([provider, models]) => ({ provider, models }));
    }, [capabilityFilter]);

    const isWebSearchActive = activeTools.includes("web-search");

    return (
        <div className={cn("w-full transition-all duration-200", raiseForOnboarding && "z-[70]")}>
            {/* Attached files preview */}
            {attachedFiles.length > 0 && (
                <div className="space-y-2 mb-2">
                    <div className="flex flex-wrap items-center gap-2">
                        {attachedFiles.map((f, i) => (
                            <div key={i} className="flex items-center gap-1.5 bg-[#1e1e22] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-neutral-200 shadow-sm">
                                <FileText className="w-3.5 h-3.5 text-primary" />
                                <span className="max-w-[130px] truncate font-medium">{f.name}</span>
                                {vaultAddedFiles[f.name] && (
                                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5">
                                        <Check className="w-3 h-3" /> In Vault
                                    </span>
                                )}
                                <button type="button" onClick={() => onRemoveFile(i)} className="text-neutral-400 hover:text-red-400 ml-1">
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-md">
                        <div className="flex items-center gap-2 text-xs">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            <span className="text-neutral-300">
                                Add {attachedFiles.length > 1 ? "these files" : attachedFiles[0].name} to your <strong className="text-white font-semibold">Memory Vault</strong>?
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
                            className="h-7 text-xs px-2.5 font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm"
                        >
                            {ingestingVault ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                            Yes, Add to Vault
                        </Button>
                    </div>
                </div>
            )}

            {/* Input Container - Starts as compact single-line, expands to squircle max height, scrolls cleanly */}
            {/* Input Container - 2-tier squircle card with top textarea and bottom action bar */}
            <div
                className={cn(
                    "relative w-full rounded-[24px] sm:rounded-[26px] border border-white/10 bg-[#161619] hover:border-white/15 focus-within:border-white/20 focus-within:bg-[#18181c] transition-colors duration-200 shadow-2xl",
                    "p-3 sm:p-3.5 flex flex-col gap-2"
                )}
            >
                {/* Center: Textarea auto-sizing from single-line to max height, then scrolling */}
                <div className="w-full min-h-[32px] px-0.5">
                    <textarea
                        data-chat-tour="composer"
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        onKeyDown={handleKey}
                        onFocus={() => {
                            setIsFocused(true);
                            onClearComposerShine?.();
                        }}
                        onBlur={() => {
                            setIsFocused(false);
                        }}
                        placeholder={isCenterWelcome ? "Ask anything about your career, resume, or jobs…" : "Ask a follow-up…"}
                        rows={1}
                        aria-label="Chat message"
                        className="w-full bg-transparent resize-none outline-none text-sm text-neutral-100 placeholder:text-neutral-500 leading-relaxed min-h-[30px] max-h-[140px] overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                    />
                </div>

                {/* Bottom Action Row inside the input container */}
                <div className="flex items-center justify-between gap-2 pt-0.5">
                    {/* Left: Web Search Button + Plus button */}
                    <div className="flex items-center gap-2 shrink-0">
                        {/* Standalone sleek Web Search toggle button - NO circular thing beside it */}
                        <button
                            type="button"
                            onClick={() => {
                                onToggleTool?.("web-search");
                                showToast(
                                    "default",
                                    isWebSearchActive
                                        ? "Live Web Search disabled"
                                        : "Live Web Search (Tavily & Firecrawl) active: queries ground with real-time sources"
                                );
                            }}
                            className={cn(
                                "flex items-center gap-1.5 h-8 px-2.5 rounded-full transition-all duration-200 border text-xs font-medium",
                                isWebSearchActive
                                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.25)]"
                                    : "bg-[#1c1c20] text-neutral-400 hover:text-white hover:bg-white/10 border-white/10"
                            )}
                            title={
                                isWebSearchActive
                                    ? "Web Search (Tavily & Firecrawl) active: Click to disable"
                                    : "Enable real-time Web Search (Tavily & Firecrawl)"
                            }
                            aria-label="Toggle Web Search"
                        >
                            <Search className={cn("size-3.5 stroke-[2.2]", isWebSearchActive ? "text-amber-300" : "text-neutral-400")} />
                            <span className="text-[11px] font-medium">Search</span>
                        </button>

                        {/* Plus button for attachments, vault, MCP */}
                        <Popover open={plusMenuOpen} onOpenChange={setPlusMenuOpen}>
                            <PopoverTrigger asChild>
                                <button
                                    type="button"
                                    className="size-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-colors border border-transparent hover:border-white/10"
                                    aria-label="Attachments and features"
                                    title="Attachments and tools"
                                >
                                    <Plus className="size-4" />
                                </button>
                            </PopoverTrigger>
                            <PopoverContent
                                align="start"
                                side="top"
                                sideOffset={8}
                                className="w-56 p-1.5 border-white/10 bg-[#1a1a1e] text-xs shadow-2xl rounded-xl z-[85]"
                            >
                                <button
                                    type="button"
                                    onClick={() => {
                                        fileRef.current?.click();
                                        setPlusMenuOpen(false);
                                    }}
                                    className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-neutral-300 hover:text-white hover:bg-white/10 transition-colors text-left"
                                >
                                    <Paperclip className="size-4 text-indigo-400" />
                                    <div>
                                        <p className="font-medium text-white">Attach Documents</p>
                                        <p className="text-[10px] text-neutral-400">PDF, DOCX, TXT, JSON</p>
                                    </div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        onToggleProfileContext();
                                        setPlusMenuOpen(false);
                                        showToast(
                                            "default",
                                            useProfileContext ? "Memory Vault context disabled" : "Memory Vault (RAG) context enabled"
                                        );
                                    }}
                                    className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-neutral-300 hover:text-white hover:bg-white/10 transition-colors text-left"
                                >
                                    <User className={cn("size-4", useProfileContext ? "text-emerald-400" : "text-neutral-500")} />
                                    <div>
                                        <p className="font-medium text-white">Memory Vault Context</p>
                                        <p className="text-[10px] text-neutral-400">{useProfileContext ? "Active (Personalized)" : "Disabled"}</p>
                                    </div>
                                </button>
                                {onOpenMcpDialog && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onOpenMcpDialog();
                                            setPlusMenuOpen(false);
                                        }}
                                        className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-neutral-300 hover:text-white hover:bg-white/10 transition-colors text-left"
                                    >
                                        <Plug className="size-4 text-purple-400" />
                                        <div>
                                            <p className="font-medium text-white">MCP Tools & Servers</p>
                                            <p className="text-[10px] text-neutral-400">Autonomous integrations</p>
                                        </div>
                                    </button>
                                )}
                            </PopoverContent>
                        </Popover>

                        <input
                            ref={fileRef}
                            type="file"
                            multiple
                            className="hidden"
                            onChange={onFileAttach}
                            accept=".pdf,.doc,.docx,.txt,.png,.jpg,.json,.csv"
                        />
                    </div>

                    {/* Right: Profile/Vault toggle + Send/Stop */}
                    <div className="shrink-0 flex items-center gap-1.5 sm:gap-2">
                        {/* Profile / Memory Vault (RAG) context button */}
                        <button
                            type="button"
                            onClick={() => {
                                onToggleProfileContext();
                                showToast(
                                    "default",
                                    useProfileContext ? "Memory Vault context disabled" : "Memory Vault (RAG) active: personalizing with verified resume & goals"
                                );
                            }}
                            className={cn(
                                "size-8 rounded-full flex items-center justify-center transition-all duration-200 border",
                                useProfileContext
                                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                                    : "border-transparent text-neutral-500 hover:text-neutral-300 hover:bg-white/5"
                            )}
                            title={
                                useProfileContext
                                    ? "Memory Vault (RAG) active: Injects verified resume & past conversation context"
                                    : "Memory Vault (RAG) disabled: Click to enable personalized context"
                            }
                            aria-label="Toggle Memory Vault Context"
                        >
                            <User className="size-4" />
                        </button>

                        {/* Send button replaced by Stop button when generating */}
                        {isLoading ? (
                            <button
                                type="button"
                                onClick={onStop}
                                className="size-8 rounded-full bg-[#2a2a2e] text-white hover:bg-[#38383e] flex items-center justify-center border border-white/15 transition-all shadow-md active:scale-95"
                                title="Stop AI response"
                                aria-label="Stop response"
                            >
                                <Square className="size-3.5 fill-white text-white" />
                            </button>
                        ) : value.trim().length > 0 || attachedFiles.length > 0 ? (
                            <button
                                type="button"
                                onClick={onSend}
                                disabled={disabled}
                                className="size-8 rounded-full bg-white text-black font-bold flex items-center justify-center hover:bg-neutral-200 transition-all shadow-md active:scale-95 disabled:opacity-40"
                                title="Send message (Enter or Cmd+Enter)"
                                aria-label="Send message"
                            >
                                <ArrowUp className="size-4 stroke-[2.5]" />
                            </button>
                        ) : (
                            <button
                                type="button"
                                disabled
                                className="size-8 rounded-full flex items-center justify-center text-neutral-500 bg-[#242428] cursor-not-allowed transition-colors"
                                aria-label="Send message"
                            >
                                <ArrowUp className="size-4 stroke-[2]" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Sub-bar directly underneath prompt input (Model Logo + Tools) */}
            <div className="flex items-center justify-between gap-2 px-2 pt-2 text-xs">
                {/* Left side: Active tools chips */}
                <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                    {activeTools.map((tid) => {
                        const tool = AVAILABLE_CAREER_TOOLS.find((t) => t.id === tid);
                        if (!tool) return null;
                        const ToolIcon = tool.icon;
                        return (
                            <span
                                key={tid}
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] backdrop-blur-md shadow-xs transition-all bg-indigo-500/15 border border-indigo-500/30 text-indigo-200"
                            >
                                <ToolIcon className={cn("size-3", tool.color)} />
                                <span className="truncate max-w-[140px] font-medium">{tool.shortName || tool.name}</span>
                                <button
                                    type="button"
                                    onClick={() => onToggleTool?.(tid)}
                                    className="hover:text-white text-indigo-300 ml-0.5"
                                    aria-label={`Remove ${tool.name}`}
                                >
                                    <X className="size-2.5" />
                                </button>
                            </span>
                        );
                    })}
                    {activeTools.length > 0 && (
                        <button
                            type="button"
                            onClick={onClearTools}
                            className="text-[10px] text-neutral-400 hover:text-white underline underline-offset-2 ml-1"
                        >
                            Clear all
                        </button>
                    )}
                </div>

                {/* Right side: Model (with logo) and Tools selectors */}
                <div className="flex items-center gap-2 shrink-0 ml-auto">
                    {/* Model selector with Logo and capability badges */}
                    <div className="flex items-center gap-1.5">
                        <ModelSelector open={modelMenuOpen} onOpenChange={setModelMenuOpen}>
                            <ModelSelectorTrigger asChild>
                                <button
                                    type="button"
                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-neutral-400 hover:text-neutral-200 hover:bg-white/5 transition-colors border border-white/5 hover:border-white/10"
                                    title={`Model: ${selectedModel?.label ?? model}`}
                                >
                                    {selectedModel && (
                                        <ModelSelectorLogo provider={selectedModel.provider} className="size-3.5" />
                                    )}
                                    <span className="truncate max-w-[110px]">{selectedModel?.label ? selectedModel.label.split(" ")[0] : "Model"}</span>
                                    <ChevronDown className="size-3 text-neutral-500" />
                                </button>
                            </ModelSelectorTrigger>
                            <ModelSelectorContent title="Select AI Model" className="max-w-xl">
                                <ModelSelectorInput placeholder="Search models (Gemini 4, Claude, GPT-6, DeepSeek)..." />
                                <div className="border-b border-white/10 px-2 py-1.5 bg-black/20">
                                    <CapabilityFilterBar
                                        selectedCapability={capabilityFilter}
                                        onSelectCapability={setCapabilityFilter}
                                    />
                                </div>
                                <ModelSelectorList className="max-h-[320px] overflow-y-auto p-1.5 no-scrollbar">
                                    <ModelSelectorEmpty className="py-6 text-center text-xs text-neutral-400">
                                        No models found matching search or capability.
                                    </ModelSelectorEmpty>
                                    {groupedModels.map((grp) => (
                                        <ModelSelectorGroup
                                            key={grp.provider}
                                            heading={grp.provider}
                                            className="text-[11px] text-neutral-400 px-1 py-1 font-semibold uppercase tracking-wider"
                                        >
                                            {grp.models.map((m) => (
                                                <ModelSelectorItem
                                                    key={m.value}
                                                    value={`${m.label} ${m.provider} ${m.value}`}
                                                    onSelect={() => {
                                                        onModelChange(m.value);
                                                        setModelMenuOpen(false);
                                                    }}
                                                    className={cn(
                                                        "flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl cursor-pointer transition-colors my-0.5 group",
                                                        m.value === model
                                                            ? "bg-white/15 text-white font-medium shadow-sm"
                                                            : "text-neutral-300 hover:bg-white/10 hover:text-white"
                                                    )}
                                                >
                                                    <ModelSelectorLogo provider={m.provider} className="size-3.5" />
                                                    <ModelSelectorName className="text-xs truncate">{m.label}</ModelSelectorName>
                                                    <ModelCapabilityIcons modelId={m.value} size="xs" className="ml-auto shrink-0 mr-1" />
                                                    {m.value === model && <Check className="size-3.5 text-indigo-400 ml-1 shrink-0" />}
                                                </ModelSelectorItem>
                                            ))}
                                        </ModelSelectorGroup>
                                    ))}
                                </ModelSelectorList>
                                <div className="border-t border-white/10 px-3 py-2 bg-black/30 flex items-center justify-between text-xs text-neutral-400">
                                    <span className="text-[11px] text-neutral-400">
                                        7 Capabilities: Thinking, Vision, Schema, Tools, Stream, Search, URL
                                    </span>
                                    <CapabilityLegendDialog />
                                </div>
                            </ModelSelectorContent>
                        </ModelSelector>

                        {/* Active Model Capabilities Icons right on the bar */}
                        <div className="hidden lg:flex items-center gap-1 bg-black/30 border border-white/10 rounded-full px-2 py-0.5">
                            <ModelCapabilityIcons modelId={model} size="xs" maxIcons={7} />
                        </div>
                    </div>

                    {/* Tools Selector */}
                    <ToolSelector open={toolMenuOpen} onOpenChange={setToolMenuOpen}>
                        <ToolSelectorTrigger asChild>
                            <button
                                type="button"
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 border",
                                    activeTools.length > 0
                                        ? "bg-indigo-500/20 text-indigo-200 hover:bg-indigo-500/30 border-indigo-500/35 shadow-[0_0_12px_rgba(99,102,241,0.25)]"
                                        : "bg-[#1c1c20] text-neutral-400 hover:text-neutral-200 hover:bg-white/10 border-white/10"
                                )}
                                title="Autonomous Career Tools & Settings"
                            >
                                <SlidersHorizontal className="size-3.5 text-neutral-400" />
                                <span>{activeTools.length > 0 ? `${activeTools.length} Tools Active` : "Tools"}</span>
                                <ChevronDown className="size-3 text-neutral-500" />
                            </button>
                        </ToolSelectorTrigger>
                        <ToolSelectorContent
                            title="Select Tools & Settings"
                            className="sm:max-w-xl border-white/10 bg-[#121216]/98 backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.85)] rounded-2xl overflow-hidden"
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08] bg-gradient-to-r from-indigo-500/[0.08] via-transparent to-transparent">
                                <div className="flex items-center gap-3">
                                    <div className="size-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                                        <SlidersHorizontal className="size-4" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-semibold text-white tracking-tight">Career & Agent Tools</h3>
                                            {activeTools.length > 0 && (
                                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                                                    {activeTools.length} active
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-neutral-400 mt-0.5">
                                            Enable specialized AI capabilities, ATS analyzers, and live research
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    {activeTools.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={onClearTools}
                                            className="text-[11px] font-medium text-neutral-400 hover:text-white px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
                                        >
                                            Clear all
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Search bar */}
                            <div className="p-3 border-b border-white/[0.06] bg-[#16161c]/50">
                                <ToolSelectorInput
                                    placeholder="Search tools, agents, ATS analyzers, or integrations..."
                                    className="h-10 text-xs bg-[#1a1a22] border-white/10 rounded-xl text-neutral-200 placeholder:text-neutral-500 px-3"
                                />
                            </div>

                            {/* Tools List */}
                            <ToolSelectorList className="max-h-[380px] overflow-y-auto p-3.5 space-y-4 no-scrollbar">
                                <ToolSelectorEmpty className="py-8 text-center text-xs text-neutral-400">
                                    No tools or settings found.
                                </ToolSelectorEmpty>

                                {/* Group 1: Autonomous Career Agents */}
                                <ToolSelectorGroup
                                    heading="Autonomous Career Agents"
                                    className="text-[11px] text-neutral-400 px-1 py-1 font-semibold uppercase tracking-wider mt-2"
                                >
                                    {AVAILABLE_CAREER_TOOLS.filter((t) => t.category === "Autonomous Agent" || t.category === "Document Creator").map((t) => {
                                        const isActive = activeTools.includes(t.id);
                                        const IconComp = t.icon;
                                        return (
                                            <ToolSelectorItem
                                                key={t.id}
                                                value={`${t.name} ${t.category} ${t.description}`}
                                                onSelect={() => {
                                                    onToggleTool?.(t.id);
                                                    if (!value.trim() && t.promptSuggestion) {
                                                        onChange(t.promptSuggestion);
                                                    }
                                                }}
                                                className={cn(
                                                    "flex items-center justify-between gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 border my-1.5 group select-none",
                                                    isActive
                                                        ? "bg-indigo-500/[0.12] border-indigo-500/35 shadow-[0_0_20px_rgba(99,102,241,0.15)]"
                                                        : "bg-[#18181f]/70 border-white/[0.06] hover:bg-[#202029] hover:border-white/15"
                                                )}
                                            >
                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                    <div className={cn("size-9 rounded-xl flex items-center justify-center shrink-0 border bg-gradient-to-br shadow-sm", (t as any).bgGradient || "from-white/10 to-white/5 border-white/10")}>
                                                        <IconComp className={cn("size-4", t.color)} />
                                                    </div>
                                                    <div className="flex flex-col min-w-0 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <ToolSelectorName className="text-xs font-semibold text-white group-hover:text-indigo-200 transition-colors">
                                                                {t.name}
                                                            </ToolSelectorName>
                                                            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md uppercase tracking-wider bg-white/[0.06] text-neutral-400 border border-white/10 shrink-0">
                                                                {t.category}
                                                            </span>
                                                        </div>
                                                        <ToolSelectorDescription className="text-[11px] text-neutral-400 leading-snug mt-0.5 line-clamp-1">
                                                            {t.description}
                                                        </ToolSelectorDescription>
                                                    </div>
                                                </div>
                                                <div className="shrink-0">
                                                    {isActive ? (
                                                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.25)]">
                                                            <Check className="size-3 stroke-[2.5]" /> Active
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium text-neutral-400 group-hover:text-white bg-white/5 group-hover:bg-white/10 border border-white/10 transition-colors">
                                                            Enable
                                                        </span>
                                                    )}
                                                </div>
                                            </ToolSelectorItem>
                                        );
                                    })}
                                </ToolSelectorGroup>

                                {/* Group 2: Live Grounding & Web Intelligence */}
                                <ToolSelectorGroup
                                    heading="Live Grounding & Web Research"
                                    className="text-[11px] text-neutral-400 px-1 py-1 font-semibold uppercase tracking-wider mt-2"
                                >
                                    {AVAILABLE_CAREER_TOOLS.filter((t) => t.id === "web-search").map((t) => {
                                        const isActive = activeTools.includes(t.id);
                                        const IconComp = t.icon;
                                        return (
                                            <ToolSelectorItem
                                                key={t.id}
                                                value={`${t.name} ${t.category} ${t.description} tavily firecrawl`}
                                                onSelect={() => {
                                                    onToggleTool?.(t.id);
                                                    if (!value.trim() && t.promptSuggestion) {
                                                        onChange(t.promptSuggestion);
                                                    }
                                                }}
                                                className={cn(
                                                    "flex items-center justify-between gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 border my-1.5 group select-none",
                                                    isActive
                                                        ? "bg-amber-500/[0.12] border-amber-500/35 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                                                        : "bg-[#18181f]/70 border-white/[0.06] hover:bg-[#202029] hover:border-white/15"
                                                )}
                                            >
                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                    <div className={cn("size-9 rounded-xl flex items-center justify-center shrink-0 border bg-gradient-to-br shadow-sm", (t as any).bgGradient || "from-teal-500/20 to-emerald-500/10 border-teal-500/30")}>
                                                        <IconComp className={cn("size-4", t.color)} />
                                                    </div>
                                                    <div className="flex flex-col min-w-0 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <ToolSelectorName className="text-xs font-semibold text-white group-hover:text-amber-200 transition-colors">
                                                                {t.name}
                                                            </ToolSelectorName>
                                                            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/25 shrink-0">
                                                                Tavily & Firecrawl
                                                            </span>
                                                        </div>
                                                        <ToolSelectorDescription className="text-[11px] text-neutral-400 leading-snug mt-0.5 line-clamp-1">
                                                            {t.description}
                                                        </ToolSelectorDescription>
                                                    </div>
                                                </div>
                                                <div className="shrink-0">
                                                    {isActive ? (
                                                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.25)]">
                                                            <Check className="size-3 stroke-[2.5]" /> Active
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium text-neutral-400 group-hover:text-white bg-white/5 group-hover:bg-white/10 border border-white/10 transition-colors">
                                                            Enable
                                                        </span>
                                                    )}
                                                </div>
                                            </ToolSelectorItem>
                                        );
                                    })}
                                </ToolSelectorGroup>

                                {/* Group 3: Career Prep & Outreach */}
                                <ToolSelectorGroup
                                    heading="Interview Prep & Outreach"
                                    className="text-[11px] text-neutral-400 px-1 py-1 font-semibold uppercase tracking-wider mt-2"
                                >
                                    {AVAILABLE_CAREER_TOOLS.filter((t) => t.category === "Career Prep").map((t) => {
                                        const isActive = activeTools.includes(t.id);
                                        const IconComp = t.icon;
                                        return (
                                            <ToolSelectorItem
                                                key={t.id}
                                                value={`${t.name} ${t.category} ${t.description}`}
                                                onSelect={() => {
                                                    onToggleTool?.(t.id);
                                                    if (!value.trim() && t.promptSuggestion) {
                                                        onChange(t.promptSuggestion);
                                                    }
                                                }}
                                                className={cn(
                                                    "flex items-center justify-between gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 border my-1.5 group select-none",
                                                    isActive
                                                        ? "bg-indigo-500/[0.12] border-indigo-500/35 shadow-[0_0_20px_rgba(99,102,241,0.15)]"
                                                        : "bg-[#18181f]/70 border-white/[0.06] hover:bg-[#202029] hover:border-white/15"
                                                )}
                                            >
                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                    <div className={cn("size-9 rounded-xl flex items-center justify-center shrink-0 border bg-gradient-to-br shadow-sm", (t as any).bgGradient || "from-white/10 to-white/5 border-white/10")}>
                                                        <IconComp className={cn("size-4", t.color)} />
                                                    </div>
                                                    <div className="flex flex-col min-w-0 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <ToolSelectorName className="text-xs font-semibold text-white group-hover:text-indigo-200 transition-colors">
                                                                {t.name}
                                                            </ToolSelectorName>
                                                            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md uppercase tracking-wider bg-white/[0.06] text-neutral-400 border border-white/10 shrink-0">
                                                                {t.category}
                                                            </span>
                                                        </div>
                                                        <ToolSelectorDescription className="text-[11px] text-neutral-400 leading-snug mt-0.5 line-clamp-1">
                                                            {t.description}
                                                        </ToolSelectorDescription>
                                                    </div>
                                                </div>
                                                <div className="shrink-0">
                                                    {isActive ? (
                                                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.25)]">
                                                            <Check className="size-3 stroke-[2.5]" /> Active
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium text-neutral-400 group-hover:text-white bg-white/5 group-hover:bg-white/10 border border-white/10 transition-colors">
                                                            Enable
                                                        </span>
                                                    )}
                                                </div>
                                            </ToolSelectorItem>
                                        );
                                    })}
                                </ToolSelectorGroup>

                                {/* Group 4: Profile & Memory Vault */}
                                <ToolSelectorGroup
                                    heading="Profile & Memory Vault"
                                    className="text-[11px] text-neutral-400 px-1 py-1 font-semibold uppercase tracking-wider mt-2"
                                >
                                    <ToolSelectorItem
                                        value="memory vault context rag profile"
                                        onSelect={() => {
                                            onToggleProfileContext();
                                            showToast(
                                                "default",
                                                useProfileContext ? "Memory Vault context disabled" : "Memory Vault (RAG) context enabled"
                                            );
                                        }}
                                        className={cn(
                                            "flex items-center justify-between gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 border my-1.5 group select-none",
                                            useProfileContext
                                                ? "bg-emerald-500/[0.12] border-emerald-500/35 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                                                : "bg-[#18181f]/70 border-white/[0.06] hover:bg-[#202029] hover:border-white/15"
                                        )}
                                    >
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <div className="size-9 rounded-xl flex items-center justify-center shrink-0 border border-emerald-500/30 bg-emerald-500/10 shadow-sm text-emerald-400">
                                                <User className="size-4" />
                                            </div>
                                            <div className="flex flex-col min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <ToolSelectorName className="text-xs font-semibold text-white">
                                                        Memory Vault Context (RAG)
                                                    </ToolSelectorName>
                                                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 shrink-0">
                                                        Personalized
                                                    </span>
                                                </div>
                                                <ToolSelectorDescription className="text-[11px] text-neutral-400 leading-snug mt-0.5 line-clamp-1">
                                                    {useProfileContext ? "Active: Personalizing with verified resume & career goals" : "Disabled: Click to enable personalized context"}
                                                </ToolSelectorDescription>
                                            </div>
                                        </div>
                                        <div className="shrink-0">
                                            {useProfileContext ? (
                                                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.25)]">
                                                    <Check className="size-3 stroke-[2.5]" /> Active
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium text-neutral-400 group-hover:text-white bg-white/5 group-hover:bg-white/10 border border-white/10 transition-colors">
                                                    Enable
                                                </span>
                                            )}
                                        </div>
                                    </ToolSelectorItem>

                                    <ToolSelectorItem
                                        value="profile settings configuration api keys tavily firecrawl"
                                        onSelect={() => {
                                            setToolMenuOpen(false);
                                            onOpenProfileSettings?.();
                                        }}
                                        className="flex items-center justify-between gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 border my-1.5 group select-none bg-[#18181f]/70 border-white/[0.06] hover:bg-[#202029] hover:border-white/15"
                                    >
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <div className="size-9 rounded-xl flex items-center justify-center shrink-0 border border-indigo-500/30 bg-indigo-500/10 shadow-sm text-indigo-400">
                                                <Settings2 className="size-4" />
                                            </div>
                                            <div className="flex flex-col min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <ToolSelectorName className="text-xs font-semibold text-white">
                                                        Open Full Profile Settings
                                                    </ToolSelectorName>
                                                </div>
                                                <ToolSelectorDescription className="text-[11px] text-neutral-400 leading-snug mt-0.5 line-clamp-1">
                                                    Configure target roles, personal info, and custom API keys (Tavily, Firecrawl, etc.)
                                                </ToolSelectorDescription>
                                            </div>
                                        </div>
                                        <ChevronRight className="size-4 text-neutral-500 group-hover:text-white transition-colors" />
                                    </ToolSelectorItem>

                                    {onOpenMcpDialog && (
                                        <ToolSelectorItem
                                            value="mcp tools autonomous integrations servers"
                                            onSelect={() => {
                                                setToolMenuOpen(false);
                                                onOpenMcpDialog();
                                            }}
                                            className="flex items-center justify-between gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 border my-1.5 group select-none bg-[#18181f]/70 border-white/[0.06] hover:bg-[#202029] hover:border-white/15"
                                        >
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                <div className="size-9 rounded-xl flex items-center justify-center shrink-0 border border-purple-500/30 bg-purple-500/10 shadow-sm text-purple-400">
                                                    <Plug className="size-4" />
                                                </div>
                                                <div className="flex flex-col min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <ToolSelectorName className="text-xs font-semibold text-white">
                                                            MCP Autonomous Tools
                                                        </ToolSelectorName>
                                                    </div>
                                                    <ToolSelectorDescription className="text-[11px] text-neutral-400 leading-snug mt-0.5 line-clamp-1">
                                                        Manage external Model Context Protocol servers & browser agents
                                                    </ToolSelectorDescription>
                                                </div>
                                            </div>
                                            <ChevronRight className="size-4 text-neutral-500 group-hover:text-white transition-colors" />
                                        </ToolSelectorItem>
                                    )}
                                </ToolSelectorGroup>
                            </ToolSelectorList>

                            {/* Modal Footer */}
                            <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.08] bg-[#141418] text-xs">
                                <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                                    <Sparkles className="size-3.5 text-indigo-400" />
                                    <span>Selected tools automatically ground every assistant response</span>
                                </div>
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => setToolMenuOpen(false)}
                                    className="h-7 text-xs px-3.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-sm transition-colors"
                                >
                                    Done
                                </Button>
                            </div>
                        </ToolSelectorContent>
                    </ToolSelector>
                </div>
            </div>
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
    const scrollRef = useRef<HTMLDivElement>(null);
    const bottomAnchorRef = useRef<HTMLDivElement>(null);
    const toasterRef = useRef<ToasterRef>(null);

    const showToast = useCallback((variant: 'default' | 'success' | 'error' | 'warning', msg: string) => {
        toasterRef.current?.show({
            title: variant.charAt(0).toUpperCase() + variant.slice(1),
            message: msg,
            variant,
            position: 'bottom-right',
        });
    }, []);

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
    const [activeTools, setActiveTools] = useState<string[]>([]);
    const activeToolsRef = useRef<string[]>([]);
    activeToolsRef.current = activeTools;

    const [searchSourcesDrawerOpen, setSearchSourcesDrawerOpen] = useState(false);
    const [searchSourcesData, setSearchSourcesData] = useState<{ query: string; results: WebSearchResult[] }>({
        query: "",
        results: [],
    });

    useEffect(() => {
        const handleOpenSources = (e: any) => {
            if (e?.detail) {
                setSearchSourcesData({
                    query: e.detail.query || "Web Search",
                    results: Array.isArray(e.detail.results) ? e.detail.results : [],
                });
                setSearchSourcesDrawerOpen(true);
            }
        };
        const handleKey = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
                e.preventDefault();
                setSearchSourcesDrawerOpen((prev) => !prev);
            }
        };
        window.addEventListener("open-search-sources-drawer" as any, handleOpenSources);
        window.addEventListener("keydown", handleKey);
        return () => {
            window.removeEventListener("open-search-sources-drawer" as any, handleOpenSources);
            window.removeEventListener("keydown", handleKey);
        };
    }, []);

    const handleToggleTool = useCallback((toolId: string) => {
        setActiveTools((prev) =>
            prev.includes(toolId) ? prev.filter((id) => id !== toolId) : [...prev, toolId]
        );
    }, []);

    const handleClearTools = useCallback(() => {
        setActiveTools([]);
        showToast("default", "Active tools reset.");
    }, [showToast]);

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

    // Ref so the transport closure always reads fresh settings and user
    const settingsRef = useRef(settings);
    settingsRef.current = settings;
    const userRef = useRef(user);
    userRef.current = user;

    const effectiveGoogleApiKey =
        settings.apiKey ||
        loadProviderKeys().google ||
        (user?.apiKeys as any)?.google ||
        (user?.apiKeys as any)?.gemini ||
        "";

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

    const router = useRouter();
    const navigateToProfile = useCallback(() => {
        router.push("/profile");
    }, [router]);
    const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
    const [showScrollButton, setShowScrollButton] = useState(false);

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
                const providerKeysFromStorage = loadProviderKeys();
                const userKeys = (userRef.current?.apiKeys || {}) as Record<string, string>;
                const profileKeys = (chatProfile && typeof chatProfile === "object" && (chatProfile as any).apiKeys) || {};

                // Determine active model key
                const modelLower = (mid || "").toLowerCase();
                const activeModelKey =
                    settingsRef.current.apiKey ||
                    (modelLower.startsWith("gemini") || modelLower.includes("banana")
                        ? providerKeysFromStorage.google || userKeys.google || userKeys.gemini || profileKeys.google || profileKeys.gemini
                        : modelLower.startsWith("gpt") || modelLower.startsWith("o1") || modelLower.startsWith("o3") || modelLower.startsWith("chatgpt")
                        ? providerKeysFromStorage.openai || userKeys.openai || profileKeys.openai
                        : modelLower.startsWith("claude")
                        ? providerKeysFromStorage.anthropic || userKeys.anthropic || profileKeys.anthropic
                        : modelLower.includes("deepseek")
                        ? providerKeysFromStorage.deepseek || userKeys.deepseek || profileKeys.deepseek
                        : modelLower.includes("groq")
                        ? providerKeysFromStorage.groq || userKeys.groq || profileKeys.groq
                        : modelLower.includes("mistral") || modelLower.includes("pixtral") || modelLower.includes("codestral") || modelLower.includes("magistral") || modelLower.includes("ministral")
                        ? providerKeysFromStorage.mistral || userKeys.mistral || profileKeys.mistral
                        : modelLower.includes("grok") || modelLower.includes("xai")
                        ? providerKeysFromStorage.xai || userKeys.xai || profileKeys.xai
                        : modelLower.includes("cohere") || modelLower.includes("command")
                        ? providerKeysFromStorage.cohere || userKeys.cohere || profileKeys.cohere
                        : modelLower.includes("perplexity") || modelLower.includes("sonar")
                        ? providerKeysFromStorage.perplexity || userKeys.perplexity || profileKeys.perplexity
                        : modelLower.includes("together")
                        ? providerKeysFromStorage.together || userKeys.together || profileKeys.together
                        : modelLower.includes("fireworks")
                        ? providerKeysFromStorage.fireworks || userKeys.fireworks || profileKeys.fireworks
                        : modelLower.includes("huggingface") || modelLower.includes("hf")
                        ? providerKeysFromStorage.huggingface || userKeys.huggingface || profileKeys.huggingface
                        : undefined) ||
                    providerKeysFromStorage.google ||
                    userKeys.google ||
                    userKeys.gemini ||
                    profileKeys.google ||
                    profileKeys.gemini ||
                    providerKeysFromStorage.openai ||
                    userKeys.openai;

                const mergedProviderKeys = {
                    ...providerKeysFromStorage,
                    ...(userKeys || {}),
                    google: providerKeysFromStorage.google || userKeys.google || userKeys.gemini || profileKeys.google || profileKeys.gemini,
                    gemini: providerKeysFromStorage.google || userKeys.google || userKeys.gemini || profileKeys.google || profileKeys.gemini,
                    openai: providerKeysFromStorage.openai || userKeys.openai || profileKeys.openai,
                    anthropic: providerKeysFromStorage.anthropic || userKeys.anthropic || profileKeys.anthropic,
                    deepseek: providerKeysFromStorage.deepseek || userKeys.deepseek || profileKeys.deepseek,
                    groq: providerKeysFromStorage.groq || userKeys.groq || profileKeys.groq,
                    mistral: providerKeysFromStorage.mistral || userKeys.mistral || profileKeys.mistral,
                    xai: providerKeysFromStorage.xai || userKeys.xai || profileKeys.xai,
                    together: providerKeysFromStorage.together || userKeys.together || profileKeys.together,
                    cohere: providerKeysFromStorage.cohere || userKeys.cohere || profileKeys.cohere,
                    perplexity: providerKeysFromStorage.perplexity || userKeys.perplexity || profileKeys.perplexity,
                    fireworks: providerKeysFromStorage.fireworks || userKeys.fireworks || profileKeys.fireworks,
                    huggingface: providerKeysFromStorage.huggingface || userKeys.huggingface || profileKeys.huggingface,
                    tavily: providerKeysFromStorage.tavily || userKeys.tavily,
                    firecrawl: providerKeysFromStorage.firecrawl || userKeys.firecrawl,
                    neo4jUri: providerKeysFromStorage.neo4jUri,
                    neo4jUser: providerKeysFromStorage.neo4jUser,
                    neo4jPassword: providerKeysFromStorage.neo4jPassword,
                    neo4jDatabase: providerKeysFromStorage.neo4jDatabase,
                };

                return {
                body: {
                    messages,
                    id,
                    model: mid,
                    apiKey: activeModelKey || undefined,
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
                    webSearch: activeToolsRef.current.includes("web-search"),
                    graphRag: true,
                    vectorRag: true,
                    providerKeys: mergedProviderKeys,
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

    // Keep searchSourcesData automatically populated from latest search in conversation
    useEffect(() => {
        for (let i = messages.length - 1; i >= 0; i--) {
            const text = getTextContent(messages[i]);
            if (text && text.includes("search-resources")) {
                const { components } = extractComponents(text);
                const searchComp = components.find((c) => c.type === "search-resources");
                if (searchComp?.data && Array.isArray(searchComp.data.results) && searchComp.data.results.length > 0) {
                    setSearchSourcesData({
                        query: searchComp.data.query || "Live Web Search",
                        results: searchComp.data.results,
                    });
                    break;
                }
            }
        }
    }, [messages]);

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

    const scrollToBottom = useCallback(() => {
        if (bottomAnchorRef.current) {
            bottomAnchorRef.current.scrollIntoView({ behavior: "smooth" });
        } else if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
        }
        isAtBottomRef.current = true;
        setShowScrollButton(false);
    }, []);

    const handleChatScroll = useCallback(() => {
        if (!scrollRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        // User is at bottom if distance from bottom is less than 100px
        const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
        const isAtBottom = distanceFromBottom < 100;
        isAtBottomRef.current = isAtBottom;
        setShowScrollButton(!isAtBottom);
    }, []);

    const handleRestoreCheckpoint = useCallback((messageIndex: number) => {
        setMessages(messages.slice(0, messageIndex + 1));
        showToast("default", "Restored conversation to this checkpoint");
    }, [messages, setMessages, showToast]);

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
        if (isAtBottomRef.current) {
            if (bottomAnchorRef.current) {
                bottomAnchorRef.current.scrollIntoView({ behavior: isLoading ? "auto" : "smooth" });
            } else if (scrollRef.current) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
        }
    }, [messages, isLoading, status]);

    const handleSend = useCallback(async () => {
        const trimmed = input.trim();
        if (!trimmed && attachedFiles.length === 0) return;

        let text = trimmed;
        const userTools = activeTools
            .filter((id) => !isDatabaseTool(id))
            .map((id) => AVAILABLE_CAREER_TOOLS.find((t) => t.id === id)?.name)
            .filter(Boolean);
        if (userTools.length > 0) {
            text = `[Active Tools: ${userTools.join(", ")}]\n\n${text}`;
        }
        if (attachedFiles.length > 0) {
            text = text ? `${text}\n\n[Attached files: ${attachedFiles.map((f) => f.name).join(", ")}]` : `[Attached files: ${attachedFiles.map((f) => f.name).join(", ")}]`;
        }

        setInput("");
        setAttachedFiles([]);
        sendMessage({ text });
    }, [input, attachedFiles, activeTools, sendMessage]);

    // NOTE: We intentionally do NOT auto-open job suggestions after CV generation.
    // Jobs should appear only when the user explicitly asks for them.

    const handlePrompt = useCallback((p: string) => {
        let text = p;
        const userTools = activeToolsRef.current
            .filter((id) => !isDatabaseTool(id))
            .map((id) => AVAILABLE_CAREER_TOOLS.find((t) => t.id === id)?.name)
            .filter(Boolean);
        if (userTools.length > 0) {
            text = `[Active Tools: ${userTools.join(", ")}]\n\n${text}`;
        }
        setInput("");
        sendMessage({ text });
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
                onOpenSettings={navigateToProfile}
                onOpenCommandPalette={() => setCommandPaletteOpen(true)}
            />

            {/* Scrollable Command Palette (Cmd+K / Ctrl+K) */}
            <ChatCommandPalette
                open={commandPaletteOpen}
                onOpenChange={setCommandPaletteOpen}
                sessions={sessions}
                currentId={currentSessionId}
                onSessionSelect={(id) => {
                    setCurrentSessionId(id);
                    setSidebarOpen(false);
                }}
                onNewSession={() => {
                    handleNewSession();
                    setSidebarOpen(false);
                }}
                onOpenWebview={() => setWebviewOpen((v) => !v)}
                onOpenMcp={() => setMcpDialogOpen(true)}
                onOpenGuide={() => setOnboardingOpen(true)}
                onOpenSettings={navigateToProfile}
            />

            {/* Main Content Column */}
            <div className="flex-1 flex flex-col h-full min-w-0 bg-[#161619] relative overflow-hidden">
                {/* Floating mobile sidebar trigger (unobtrusive, no top bar) */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarOpen(true)}
                    className="md:hidden fixed top-3 left-3 z-30 size-8 rounded-full bg-[#18181c]/80 backdrop-blur-md border border-white/10 text-neutral-400 hover:text-white hover:bg-white/10 transition-colors shadow-lg"
                    aria-label="Open sidebar"
                    type="button"
                >
                    <Menu className="size-4" />
                </Button>

                {/* Floating Top-Right Controls with Inbound Curves (Stop + Search + Settings) */}
                <TopCornerControls
                    isLoading={isLoading}
                    onStop={stop}
                    onOpenSettings={navigateToProfile}
                    onOpenCommandPalette={() => setCommandPaletteOpen(true)}
                />

                {/* Error banner */}
                {error && (
                    <div className="fixed top-14 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-destructive/10 border border-destructive/30 text-destructive rounded-xl px-4 py-2 text-xs shadow-lg">
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
                                                    chatApiKey={effectiveGoogleApiKey}
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
                                        chatApiKey={effectiveGoogleApiKey}
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
                        <AnimatePresence mode="wait">
                            {showWelcome ? (
                                <motion.div
                                    key="split-welcome"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0, y: -20, filter: "blur(6px)" }}
                                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                                    className="flex-1 flex flex-col items-center justify-center px-4 py-8 relative z-10 min-h-0 overflow-y-auto"
                                >
                                    <div className="w-full max-w-xl mx-auto flex flex-col items-center -mt-8 sm:-mt-12">
                                        <WelcomeHero />
                                        <motion.div
                                            layoutId="chat-composer-split"
                                            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                                            className="w-full"
                                        >
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
                                                isLoading={isLoading}
                                                onStop={stop}
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
                                                isCenterWelcome={true}
                                                activeTools={activeTools}
                                                onToggleTool={handleToggleTool}
                                                onClearTools={handleClearTools}
                                                onOpenProfileSettings={navigateToProfile}
                                            />
                                        </motion.div>

                                        {/* Centered prompt suggestions underneath composer (matching Image 1) */}
                                        <div className="flex flex-wrap items-center justify-center gap-2 mt-5 max-w-xl mx-auto px-2">
                                            {HERO_SUGGESTIONS.map((item) => {
                                                const IconComp = item.icon;
                                                return (
                                                    <button
                                                        key={item.label}
                                                        type="button"
                                                        onClick={() => {
                                                            setInput(item.prompt);
                                                        }}
                                                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium text-neutral-300 bg-[#1c1c20] hover:bg-[#28282e] hover:text-white border border-white/5 hover:border-white/10 transition-all duration-150 shadow-sm"
                                                    >
                                                        <IconComp className="size-3.5 text-neutral-400" />
                                                        <span>{item.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="split-messages"
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                                    className="flex-1 flex flex-col min-h-0 relative"
                                >
                                    <div
                                        ref={scrollRef}
                                        onScroll={handleChatScroll}
                                        className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain px-3 sm:px-4 py-4 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                                        style={{ scrollbarWidth: "none" }}
                                    >
                                        <div className="mx-auto w-full max-w-2xl space-y-6 pb-6">
                                            {messages.map((msg, i) => (
                                                <React.Fragment key={msg.id ?? i}>
                                                    <MessageBubble
                                                        message={msg}
                                                        isStreaming={isLoading && i === messages.length - 1 && msg.role === "assistant"}
                                                        onReply={(t) => setInput(`Regarding: "${t.slice(0, 60)}…"\n\n`)}
                                                        onToast={showToast}
                                                        chatApiKey={effectiveGoogleApiKey}
                                                        chatModel={settings.model}
                                                        canonicalResumeKey={canonicalResumeKey}
                                                        activeStageComponentId={activeStageComponent?.id}
                                                        onPopOutToSide={(comp) => {
                                                            setActiveStageComponent(comp);
                                                            setActiveSideTab("stage");
                                                        }}
                                                        onDockToChat={() => setActiveStageComponent(null)}
                                                    />

                                                    {/* Checkpoint divider between conversation turns (Video 1) */}
                                                    {msg.role === "assistant" && i < messages.length - 1 && (
                                                        <div className="flex items-center justify-center gap-3 py-2 text-xs text-neutral-500 select-none">
                                                            <div className="h-px bg-white/5 flex-1" />
                                                            <span className="text-[11px] font-medium tracking-wider uppercase text-neutral-500">Checkpoint</span>
                                                            <span className="text-neutral-600">|</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRestoreCheckpoint(i)}
                                                                className="text-[11px] text-neutral-400 hover:text-white underline transition-colors"
                                                                title="Restore conversation to this turn"
                                                            >
                                                                Restore
                                                            </button>
                                                            <div className="h-px bg-white/5 flex-1" />
                                                        </div>
                                                    )}
                                                </React.Fragment>
                                            ))}

                                            {/* Animated Thinking Indicator */}
                                            <AnimatePresence>
                                                {status === "submitted" && <ThinkingIndicator />}
                                            </AnimatePresence>

                                            {/* Invisible Bottom Anchor Ref */}
                                            <div ref={bottomAnchorRef} className="h-px w-full pointer-events-none" />
                                        </div>
                                    </div>

                                    {/* Anchor Message Navigation Rail (Image 2) */}
                                    <AnchorMessageScroller
                                        messages={messages}
                                        containerRef={scrollRef}
                                    />

                                    {/* Floating Scroll to Bottom Down Arrow (Matching Image 4) */}
                                    <AnimatePresence>
                                        {showScrollButton && (
                                            <TooltipProvider delayDuration={100}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <motion.button
                                                            type="button"
                                                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                                            exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                                            transition={{ duration: 0.15 }}
                                                            onClick={scrollToBottom}
                                                            className="absolute bottom-24 sm:bottom-28 right-6 sm:right-10 z-30 size-9 sm:size-10 rounded-full bg-[#1e1e24] hover:bg-[#282830] text-neutral-300 hover:text-white border border-white/10 shadow-xl flex items-center justify-center transition-all duration-150 backdrop-blur-md active:scale-95 group"
                                                            aria-label="Scroll to bottom"
                                                        >
                                                            <ChevronDown className="size-5 stroke-[2.2] group-hover:translate-y-0.5 transition-transform" />
                                                        </motion.button>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="left" className="bg-[#121215] border-white/10 text-xs text-neutral-200 shadow-xl py-1 px-2.5">
                                                        Scroll to bottom
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}
                                    </AnimatePresence>

                                    <motion.div
                                        layoutId="chat-composer-split"
                                        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                                        className="shrink-0 p-3 bg-gradient-to-t from-[#161619] via-[#161619]/90 to-transparent z-20"
                                    >
                                        <div className="mx-auto w-full max-w-2xl">
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
                                                isLoading={isLoading}
                                                onStop={stop}
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
                                                isCenterWelcome={false}
                                                activeTools={activeTools}
                                                onToggleTool={handleToggleTool}
                                                onClearTools={handleClearTools}
                                                onOpenProfileSettings={navigateToProfile}
                                            />
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
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
                                                    chatApiKey={effectiveGoogleApiKey}
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
                                        chatApiKey={effectiveGoogleApiKey}
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
                <AnimatePresence mode="wait">
                    {showWelcome ? (
                        <motion.div
                            key="fs-welcome"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, y: -20, filter: "blur(6px)" }}
                            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                            className="flex-1 flex flex-col items-center justify-center px-4 py-8 relative z-10 min-h-0 overflow-y-auto"
                        >
                            <div className="w-full max-w-2xl mx-auto flex flex-col items-center -mt-12 sm:-mt-20">
                                <WelcomeHero />
                                <motion.div
                                    layoutId="chat-composer-fullscreen"
                                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                                    className="w-full"
                                >
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
                                        isLoading={isLoading}
                                        onStop={stop}
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
                                        isCenterWelcome={true}
                                        activeTools={activeTools}
                                        onToggleTool={handleToggleTool}
                                        onClearTools={handleClearTools}
                                        onOpenProfileSettings={navigateToProfile}
                                    />
                                </motion.div>

                                {/* Centered prompt suggestions underneath composer (matching Image 1) */}
                                <div className="flex flex-wrap items-center justify-center gap-2 mt-5 max-w-2xl mx-auto px-2">
                                    {HERO_SUGGESTIONS.map((item) => {
                                        const IconComp = item.icon;
                                        return (
                                            <button
                                                key={item.label}
                                                type="button"
                                                onClick={() => {
                                                    setInput(item.prompt);
                                                }}
                                                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium text-neutral-300 bg-[#1c1c20] hover:bg-[#28282e] hover:text-white border border-white/5 hover:border-white/10 transition-all duration-150 shadow-sm"
                                            >
                                                <IconComp className="size-3.5 text-neutral-400" />
                                                <span>{item.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="fs-chat"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                            className="flex-1 flex flex-col min-h-0 relative"
                        >
                            <div
                                ref={scrollRef}
                                onScroll={handleChatScroll}
                                className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain px-3 sm:px-5 py-4 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                                style={{ scrollbarWidth: "none" }}
                            >
                                <div className="mx-auto w-full max-w-3xl space-y-6 pb-6">
                                    {messages.map((msg, i) => (
                                        <React.Fragment key={msg.id ?? i}>
                                            <MessageBubble
                                                message={msg}
                                                isStreaming={isLoading && i === messages.length - 1 && msg.role === "assistant"}
                                                onReply={(t) => setInput(`Regarding: "${t.slice(0, 60)}…"\n\n`)}
                                                onToast={showToast}
                                                chatApiKey={effectiveGoogleApiKey}
                                                chatModel={settings.model}
                                                canonicalResumeKey={canonicalResumeKey}
                                                activeStageComponentId={null}
                                                onPopOutToSide={(comp) => {
                                                    setActiveStageComponent(comp);
                                                    setActiveSideTab("stage");
                                                }}
                                                onDockToChat={() => setActiveStageComponent(null)}
                                            />

                                            {/* Checkpoint divider between conversation turns (Video 1) */}
                                            {msg.role === "assistant" && i < messages.length - 1 && (
                                                <div className="flex items-center justify-center gap-3 py-2 text-xs text-neutral-500 select-none">
                                                    <div className="h-px bg-white/5 flex-1" />
                                                    <span className="text-[11px] font-medium tracking-wider uppercase text-neutral-500">Checkpoint</span>
                                                    <span className="text-neutral-600">|</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRestoreCheckpoint(i)}
                                                        className="text-[11px] text-neutral-400 hover:text-white underline transition-colors"
                                                        title="Restore conversation to this turn"
                                                    >
                                                        Restore
                                                    </button>
                                                    <div className="h-px bg-white/5 flex-1" />
                                                </div>
                                            )}
                                        </React.Fragment>
                                    ))}

                                    {/* Animated Thinking Indicator */}
                                    <AnimatePresence>
                                        {status === "submitted" && <ThinkingIndicator />}
                                    </AnimatePresence>

                                    {/* Invisible Bottom Anchor Ref */}
                                    <div ref={bottomAnchorRef} className="h-px w-full pointer-events-none" />
                                </div>
                            </div>

                            {/* Anchor Message Navigation Rail (Image 2) */}
                            <AnchorMessageScroller
                                messages={messages}
                                containerRef={scrollRef}
                            />

                            {/* Floating Scroll to Bottom Down Arrow (Matching Image 4) */}
                            <AnimatePresence>
                                {showScrollButton && (
                                    <TooltipProvider delayDuration={100}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <motion.button
                                                    type="button"
                                                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                                    transition={{ duration: 0.15 }}
                                                    onClick={scrollToBottom}
                                                    className="absolute bottom-24 sm:bottom-28 right-6 sm:right-10 z-30 size-9 sm:size-10 rounded-full bg-[#1e1e24] hover:bg-[#282830] text-neutral-300 hover:text-white border border-white/10 shadow-xl flex items-center justify-center transition-all duration-150 backdrop-blur-md active:scale-95 group"
                                                    aria-label="Scroll to bottom"
                                                >
                                                    <ChevronDown className="size-5 stroke-[2.2] group-hover:translate-y-0.5 transition-transform" />
                                                </motion.button>
                                            </TooltipTrigger>
                                            <TooltipContent side="left" className="bg-[#121215] border-white/10 text-xs text-neutral-200 shadow-xl py-1 px-2.5">
                                                Scroll to bottom
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                            </AnimatePresence>

                            {/* Docked bottom composer */}
                            <motion.div
                                layoutId="chat-composer-fullscreen"
                                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                                className="shrink-0 p-3 sm:p-4 bg-gradient-to-t from-[#161619] via-[#161619]/90 to-transparent z-20"
                            >
                                <div className="mx-auto w-full max-w-3xl">
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
                                        isLoading={isLoading}
                                        onStop={stop}
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
                                        isCenterWelcome={false}
                                        activeTools={activeTools}
                                        onToggleTool={handleToggleTool}
                                        onClearTools={handleClearTools}
                                        onOpenProfileSettings={navigateToProfile}
                                    />
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            )}

            {resumeApplyOfferId && (
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


            {/* Search Sources Right Drawer (Matching Image 2) */}
            <SearchSourcesDrawer
                isOpen={searchSourcesDrawerOpen}
                onClose={() => setSearchSourcesDrawerOpen(false)}
                query={searchSourcesData.query}
                results={searchSourcesData.results}
                onFeedbackClick={() => showToast("success", "Search feedback recorded!")}
            />

            </div>
        </div>
        </TooltipProvider>
    );
}
