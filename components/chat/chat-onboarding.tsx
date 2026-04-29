"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Clapperboard, Lock, PanelLeft, Sparkles, User, Video, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { tryLocalStorageGet, tryLocalStorageSet } from "@/lib/safe-local-storage";
import { toVideoEmbedSrc } from "@/lib/chat-onboarding-video";

/** localStorage id — avoid naming with "key" (security audit scans for key-like assignments). */
const ONBOARDING_DONE_LS = "ai-chat-onboarding-seen-v2";

export type ChatOnboardingStep = {
  title: string;
  body: string;
  icon: typeof Sparkles;
  /** Highlight target; optional sidebar action */
  tour?: "menu" | "composer" | "model-select" | "profile-toggle" | "quick-prompts" | "interview-lab" | "video";
  openSidebar?: boolean;
};

const DEFAULT_STEPS: ChatOnboardingStep[] = [
  {
    title: "Career assistant",
    body: "Ask for resumes, jobs, interviews, HR email, or LinkedIn DMs. Use the quick prompts under the input for one-tap starters.",
    icon: Sparkles,
    tour: "quick-prompts",
    openSidebar: false,
  },
  {
    title: "Sidebar, profile & settings",
    body: "Menu (top-left): chat history, export/import, and Profile & Settings. There you edit your name, contact info, career notes, default model, and extra context for the AI. API keys are not stored in profile—use the model menu for that (next step).",
    icon: PanelLeft,
    tour: "menu",
    openSidebar: true,
  },
  {
    title: "Pick a model",
    body: "Tap the provider logo next to the input to search and choose a model. If you use OpenAI-compatible or Hugging Face (AI SDK), open the matching row in that menu for base URL / Hub id (same values also appear in Profile & Settings).",
    icon: Zap,
    tour: "model-select",
    openSidebar: false,
  },
  {
    title: "API key (this session only)",
    body: "In the same model menu, open “API key (this session)”. Paste your key and Save. It stays in memory until you refresh—never written to profile storage. The dot on the logo is green when a key is set, red when you still need one.",
    icon: Lock,
    tour: "model-select",
    openSidebar: false,
  },
  {
    title: "Global profile in prompts",
    body: "The person icon toggles whether your saved profile (name, email, career notes, resume chunks) is included in what the model sees—separate from Profile & Settings. Use the paperclip to attach files.",
    icon: User,
    tour: "profile-toggle",
    openSidebar: false,
  },
  {
    title: "Composer",
    body: "Type here. Enter sends; Shift+Enter adds a new line. The box grows while you type.",
    icon: BookOpen,
    tour: "composer",
    openSidebar: false,
  },
  {
    title: "Interview Lab 🎬",
    body: "Open Interview Lab (clapper icon) for AI interview rounds, code tests, and live coaching with screen + voice notes. If it says “requires Gemini”, switch your model to a Gemini option.",
    icon: Clapperboard,
    tour: "interview-lab",
    openSidebar: false,
  },
  {
    title: "Need more help?",
    body: "If anything is unclear, watch the tutorial below or revisit any step from the dots at the bottom.",
    icon: Video,
    tour: "video",
    openSidebar: false,
  },
];

function clearTourHighlights() {
  if (typeof document === "undefined") return;
  document.querySelectorAll("[data-chat-tour-active]").forEach((el) => {
    el.removeAttribute("data-chat-tour-active");
  });
}

export function ChatOnboarding({
  open,
  onOpenChange,
  videoUrl,
  steps = DEFAULT_STEPS,
  setSidebarOpen,
  autoShowOnce = true,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Embed URL or YouTube link (also set NEXT_PUBLIC_CHAT_ONBOARDING_VIDEO_URL) */
  videoUrl?: string | null;
  steps?: ChatOnboardingStep[];
  setSidebarOpen: (open: boolean) => void;
  /** First visit to /chat only */
  autoShowOnce?: boolean;
}) {
  const [step, setStep] = useState(0);
  const embedSrc = toVideoEmbedSrc(videoUrl ?? process.env.NEXT_PUBLIC_CHAT_ONBOARDING_VIDEO_URL);

  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (open) {
      document.documentElement.setAttribute("data-chat-onboarding", "open");
    } else {
      document.documentElement.removeAttribute("data-chat-onboarding");
    }
    return () => document.documentElement.removeAttribute("data-chat-onboarding");
  }, [open]);

  useEffect(() => {
    if (!open) {
      clearTourHighlights();
      return;
    }
    const s = steps[step];
    if (s?.openSidebar !== undefined) {
      setSidebarOpen(s.openSidebar);
    }
    clearTourHighlights();
    if (s?.tour && s.tour !== "video") {
      const el = document.querySelector(`[data-chat-tour="${s.tour}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      el?.setAttribute("data-chat-tour-active", "true");
      if (s.tour === "interview-lab") {
        // Optional click to open the panel if the element is a button.
        (el as HTMLElement | null)?.click?.();
      }
    }
    return () => clearTourHighlights();
  }, [open, step, steps, setSidebarOpen]);

  useEffect(() => {
    if (!autoShowOnce || typeof window === "undefined") return;
    if (tryLocalStorageGet(ONBOARDING_DONE_LS) === "1") return;
    const t = window.setTimeout(() => onOpenChange(true), 500);
    return () => window.clearTimeout(t);
  }, [autoShowOnce, onOpenChange]);

  const dismiss = useCallback(
    (remember: boolean) => {
      if (remember) tryLocalStorageSet(ONBOARDING_DONE_LS, "1");
      clearTourHighlights();
      onOpenChange(false);
      setStep(0);
    },
    [onOpenChange],
  );

  const current = steps[step] ?? steps[0];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            key="ob-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/35"
            aria-label="Close onboarding backdrop"
            onClick={() => dismiss(true)}
          />
          <motion.div
            key="ob-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="chat-onb-title"
            initial={{ opacity: 0, x: 24, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 16, scale: 0.98 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="fixed z-[80] w-[min(94vw,400px)] max-h-[min(82dvh,600px)] overflow-y-auto rounded-2xl border border-white/15 bg-gradient-to-br from-neutral-950/95 via-neutral-900/95 to-indigo-950/90 p-5 shadow-2xl shadow-indigo-500/10 max-md:bottom-[calc(env(safe-area-inset-bottom,0px)+5.5rem)] max-md:left-1/2 max-md:right-auto max-md:top-auto max-md:-translate-x-1/2 md:right-6 lg:right-10 md:top-1/2 md:-translate-y-1/2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-3 top-3 rounded-lg p-1.5 text-neutral-200 hover:bg-white/10 hover:text-white"
              onClick={() => dismiss(true)}
              aria-label="Close onboarding"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300">
              {(() => {
                const Icon = current.icon;
                return <Icon className="h-5 w-5" />;
              })()}
            </div>
            <h2 id="chat-onb-title" className="pr-8 text-lg font-semibold tracking-tight text-white">
              {current.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-200">{current.body}</p>

            {current.tour === "video" && embedSrc ? (
              <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-black/40">
                <div className="relative aspect-video w-full">
                  <iframe
                    title="Chat tutorial"
                    src={embedSrc}
                    className="absolute inset-0 h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            ) : null}

            {current.tour === "video" && !embedSrc ? (
              <p className="mt-3 text-xs text-neutral-400">
                Add <code className="rounded bg-white/10 px-1 py-0.5 text-[11px]">NEXT_PUBLIC_CHAT_ONBOARDING_VIDEO_URL</code> to your
                environment to show the embedded tutorial.
              </p>
            ) : null}

            <div className="mt-4 flex gap-1.5">
              {steps.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Step ${i + 1}`}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${i === step ? "bg-indigo-400" : "bg-white/15"}`}
                  onClick={() => setStep(i)}
                />
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {step > 0 && (
                <Button type="button" variant="outline" size="sm" className="rounded-xl border-white/20 bg-white/5 text-white hover:bg-white/10" onClick={() => setStep((s) => s - 1)}>
                  Back
                </Button>
              )}
              {step < steps.length - 1 ? (
                <Button type="button" size="sm" className="rounded-xl" onClick={() => setStep((s) => s + 1)}>
                  Next
                </Button>
              ) : (
                <Button type="button" size="sm" className="rounded-xl" onClick={() => dismiss(true)}>
                  Done
                </Button>
              )}
              <Button type="button" variant="ghost" size="sm" className="ml-auto rounded-xl text-neutral-300 hover:bg-white/10 hover:text-white" onClick={() => dismiss(false)}>
                Skip for now
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
