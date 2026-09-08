"use client";

import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

export type PersonaState = "idle" | "listening" | "thinking" | "speaking" | "asleep";
export type PersonaVariant = "obsidian" | "mana" | "opal" | "halo" | "glint" | "command";

export interface PersonaProps {
  state?: PersonaState;
  variant?: PersonaVariant;
  className?: string;
  interactive?: boolean;
  onLoad?: () => void;
  onLoadError?: (error: unknown) => void;
  onReady?: () => void;
  onPause?: () => void;
  onPlay?: () => void;
  onStop?: () => void;
  onClick?: () => void;
}

interface VariantTheme {
  id: PersonaVariant;
  name: string;
  glowColor: string;
  ringColor: string;
  bgGradient: [string, string, string];
  eyeColor: string;
  accentColor: string;
  particleColor: string;
  friendlyDescription: string;
}

const THEMES: Record<PersonaVariant, VariantTheme> = {
  obsidian: {
    id: "obsidian",
    name: "Obsidian",
    glowColor: "rgba(139, 92, 246, 0.45)",
    ringColor: "rgba(168, 85, 247, 0.6)",
    bgGradient: ["#0f172a", "#1e1b4b", "#312e81"],
    eyeColor: "#c084fc",
    accentColor: "#a855f7",
    particleColor: "#e9d5ff",
    friendlyDescription: "Deep Cosmic Intelligence",
  },
  mana: {
    id: "mana",
    name: "Mana",
    glowColor: "rgba(6, 182, 212, 0.45)",
    ringColor: "rgba(14, 165, 233, 0.6)",
    bgGradient: ["#082f49", "#0c4a6e", "#0369a1"],
    eyeColor: "#67e8f9",
    accentColor: "#38bdf8",
    particleColor: "#cffafe",
    friendlyDescription: "Arcane Flow & Inspiration",
  },
  opal: {
    id: "opal",
    name: "Opal",
    glowColor: "rgba(236, 72, 153, 0.45)",
    ringColor: "rgba(244, 114, 182, 0.6)",
    bgGradient: ["#500724", "#701a75", "#831843"],
    eyeColor: "#f472b6",
    accentColor: "#ec4899",
    particleColor: "#fce7f3",
    friendlyDescription: "Warm Iridescent Empathy",
  },
  halo: {
    id: "halo",
    name: "Halo",
    glowColor: "rgba(245, 158, 11, 0.45)",
    ringColor: "rgba(251, 191, 36, 0.6)",
    bgGradient: ["#451a03", "#78350f", "#92400e"],
    eyeColor: "#fde047",
    accentColor: "#f59e0b",
    particleColor: "#fef9c3",
    friendlyDescription: "Radiant Golden Energy",
  },
  glint: {
    id: "glint",
    name: "Glint",
    glowColor: "rgba(16, 185, 129, 0.45)",
    ringColor: "rgba(52, 211, 153, 0.6)",
    bgGradient: ["#022c22", "#064e3b", "#065f46"],
    eyeColor: "#6ee7b7",
    accentColor: "#10b981",
    particleColor: "#d1fae5",
    friendlyDescription: "Sharp Emerald Focus",
  },
  command: {
    id: "command",
    name: "Command",
    glowColor: "rgba(34, 197, 94, 0.5)",
    ringColor: "rgba(74, 222, 128, 0.7)",
    bgGradient: ["#052e16", "#14532d", "#166534"],
    eyeColor: "#4ade80",
    accentColor: "#22c55e",
    particleColor: "#bbf7d0",
    friendlyDescription: "Cybernetic High-Performance",
  },
};

export function Persona({
  state = "idle",
  variant = "obsidian",
  className,
  interactive = true,
  onLoad,
  onLoadError,
  onReady,
  onPause,
  onPlay,
  onStop,
  onClick,
}: PersonaProps) {
  const [mounted, setMounted] = useState(false);
  const [isWinking, setIsWinking] = useState(false);
  const theme = THEMES[variant] || THEMES.obsidian;

  useEffect(() => {
    try {
      onLoad?.();
      setMounted(true);
      onReady?.();
      onPlay?.();
    } catch (err) {
      onLoadError?.(err);
    }

    return () => {
      onStop?.();
    };
  }, [onLoad, onReady, onPlay, onStop, onLoadError]);

  const handlePersonaClick = () => {
    if (interactive) {
      setIsWinking(true);
      setTimeout(() => setIsWinking(false), 900);
    }
    onClick?.();
  };

  const stateVariants = useMemo(() => {
    switch (state) {
      case "listening":
        return {
          scale: [1, 1.06, 1],
          transition: { repeat: Infinity, duration: 1.4, ease: "easeInOut" },
        };
      case "thinking":
        return {
          rotate: [0, 6, -6, 0],
          scale: [1, 1.03, 1],
          transition: { repeat: Infinity, duration: 2.2, ease: "easeInOut" },
        };
      case "speaking":
        return {
          scale: [1, 1.08, 0.98, 1.05, 1],
          transition: { repeat: Infinity, duration: 0.85, ease: "easeInOut" },
        };
      case "asleep":
        return {
          scale: [1, 0.97, 1],
          transition: { repeat: Infinity, duration: 3.5, ease: "easeInOut" },
        };
      case "idle":
      default:
        return {
          scale: [1, 1.02, 1],
          transition: { repeat: Infinity, duration: 2.8, ease: "easeInOut" },
        };
    }
  }, [state]);

  const stateFriendlyLabel = useMemo(() => {
    switch (state) {
      case "listening":
        return "I'm listening closely...";
      case "thinking":
        return "Thinking and searching answers...";
      case "speaking":
        return "Sharing insights...";
      case "asleep":
        return "Resting (ready when you are!)";
      case "idle":
      default:
        return "Ready to help you build!";
    }
  }, [state]);

  const content = (
    <div
      data-testid="persona-avatar"
      data-persona-state={state}
      data-persona-variant={variant}
      onClick={handlePersonaClick}
      className={cn(
        "relative flex items-center justify-center select-none overflow-visible transition-transform duration-200",
        interactive && "cursor-pointer hover:scale-110 active:scale-95",
        className || "size-8"
      )}
      style={{ filter: `drop-shadow(0 0 10px ${theme.glowColor})` }}
    >
      {/* Listening / Speaking Outward Expanding Waves */}
      <AnimatePresence>
        {(state === "listening" || state === "speaking") && (
          <>
            <motion.div
              initial={{ scale: 0.8, opacity: 0.8 }}
              animate={{ scale: 1.6, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ repeat: Infinity, duration: state === "speaking" ? 0.9 : 1.5, ease: "easeOut" }}
              className="absolute inset-0 rounded-full border border-dashed pointer-events-none"
              style={{ borderColor: theme.ringColor }}
            />
            <motion.div
              initial={{ scale: 0.8, opacity: 0.5 }}
              animate={{ scale: 2.1, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ repeat: Infinity, duration: state === "speaking" ? 0.9 : 1.5, delay: 0.35, ease: "easeOut" }}
              className="absolute inset-0 rounded-full border pointer-events-none"
              style={{ borderColor: theme.ringColor }}
            />
          </>
        )}
      </AnimatePresence>

      {/* Thinking Orbiting Neural Particles */}
      <AnimatePresence>
        {state === "thinking" && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2.4, ease: "linear" }}
            className="absolute inset-[-4px] pointer-events-none"
          >
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 size-1.5 rounded-full shadow-sm"
              style={{ backgroundColor: theme.particleColor, boxShadow: `0 0 8px ${theme.accentColor}` }}
            />
            <div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 size-1 rounded-full opacity-80"
              style={{ backgroundColor: theme.particleColor }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Asleep Floating Z's */}
      <AnimatePresence>
        {state === "asleep" && (
          <motion.div
            initial={{ opacity: 0, y: 0, scale: 0.5 }}
            animate={{ opacity: [0, 1, 0], y: -16, scale: [0.6, 1, 1.2], x: [0, 4, 8] }}
            exit={{ opacity: 0 }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeOut" }}
            className="absolute -top-3 -right-2 text-[10px] font-bold pointer-events-none"
            style={{ color: theme.eyeColor }}
          >
            z Z
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persona Core Orb & Animated Facial Expression */}
      <motion.div
        animate={stateVariants}
        className="relative size-full rounded-full flex items-center justify-center shadow-inner overflow-hidden"
        style={{
          background: `radial-gradient(circle at 35% 30%, ${theme.bgGradient[2]}, ${theme.bgGradient[1]} 60%, ${theme.bgGradient[0]} 100%)`,
          border: `1.5px solid ${theme.accentColor}88`,
        }}
      >
        {/* Specular Highlight */}
        <div className="absolute top-1 left-1.5 w-1/3 h-1/4 rounded-full bg-white/30 blur-[0.5px] pointer-events-none" />

        {/* Dynamic Emoji Face */}
        <svg viewBox="0 0 36 36" className="size-4/5 pointer-events-none" fill="none">
          {/* Eyes based on state & wink animation */}
          {isWinking ? (
            /* Friendly Cheerful Wink: Left open smiling, Right wink curved */
            <>
              <circle cx="12" cy="15" r="2.6" fill={theme.eyeColor} />
              <circle cx="12.8" cy="14" r="0.9" fill="#ffffff" />
              <path
                d="M 21 16 Q 24 13 27 16"
                stroke={theme.eyeColor}
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <path
                d="M 13 22 Q 18 26 23 22"
                stroke={theme.eyeColor}
                strokeWidth="2"
                strokeLinecap="round"
              />
            </>
          ) : state === "asleep" ? (
            /* Curved peaceful sleeping eyes */
            <>
              <path
                d="M 10 16 Q 13 20 16 16"
                stroke={theme.eyeColor}
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <path
                d="M 20 16 Q 23 20 26 16"
                stroke={theme.eyeColor}
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <path
                d="M 15 23 Q 18 25 21 23"
                stroke={theme.eyeColor}
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </>
          ) : state === "thinking" ? (
            /* Curious upward-glancing eyes */
            <>
              <circle cx="13" cy="13" r="2.8" fill={theme.eyeColor} />
              <circle cx="23" cy="13" r="2.8" fill={theme.eyeColor} />
              <circle cx="14" cy="12" r="1.1" fill="#ffffff" />
              <circle cx="24" cy="12" r="1.1" fill="#ffffff" />
              <path
                d="M 15 22 Q 18 20 21 22"
                stroke={theme.eyeColor}
                strokeWidth="2"
                strokeLinecap="round"
              />
            </>
          ) : state === "listening" ? (
            /* Wide attentive glowing eyes */
            <>
              <circle cx="12" cy="15" r="3.4" fill={theme.eyeColor} />
              <circle cx="24" cy="15" r="3.4" fill={theme.eyeColor} />
              <circle cx="12.5" cy="14" r="1.3" fill="#ffffff" />
              <circle cx="24.5" cy="14" r="1.3" fill="#ffffff" />
              <path
                d="M 14 23 Q 18 27 22 23"
                stroke={theme.eyeColor}
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </>
          ) : state === "speaking" ? (
            /* Animated talking smile & lively eyes */
            <>
              <circle cx="12" cy="14" r="2.7" fill={theme.eyeColor} />
              <circle cx="24" cy="14" r="2.7" fill={theme.eyeColor} />
              <circle cx="13" cy="13" r="1" fill="#ffffff" />
              <circle cx="25" cy="13" r="1" fill="#ffffff" />
              <ellipse
                cx="18"
                cy="23"
                rx="4.2"
                ry="3"
                fill={theme.accentColor}
                stroke={theme.eyeColor}
                strokeWidth="1.2"
              />
            </>
          ) : (
            /* Idle: Friendly smiling emoji face */
            <>
              <circle cx="12" cy="15" r="2.6" fill={theme.eyeColor} />
              <circle cx="24" cy="15" r="2.6" fill={theme.eyeColor} />
              <circle cx="12.8" cy="14" r="0.9" fill="#ffffff" />
              <circle cx="24.8" cy="14" r="0.9" fill="#ffffff" />
              <path
                d="M 13 22 Q 18 26 23 22"
                stroke={theme.eyeColor}
                strokeWidth="2"
                strokeLinecap="round"
              />
            </>
          )}
        </svg>
      </motion.div>
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="top" className="text-xs max-w-[200px] text-center">
          <p className="font-semibold text-foreground">
            {theme.name} AI • {theme.friendlyDescription}
          </p>
          <p className="text-[11px] text-muted-foreground">{stateFriendlyLabel}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
