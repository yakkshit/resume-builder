"use client";

import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

export type PersonaState = "idle" | "listening" | "thinking" | "speaking" | "asleep";
export type PersonaVariant = "theme" | "companion" | "obsidian" | "mana" | "opal" | "halo" | "glint" | "command";

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
  bgGradient: [string, string, string, string];
  eyeColor: string;
  accentColor: string;
  blushColor: string;
  particleColor: string;
  friendlyDescription: string;
}

const THEMES: Record<PersonaVariant, VariantTheme> = {
  // Theme: The project's signature electric volt-lime jelly blob (#aff33e)
  theme: {
    id: "theme",
    name: "Volt Lime",
    glowColor: "rgba(175, 243, 62, 0.5)",
    ringColor: "rgba(175, 243, 62, 0.9)",
    bgGradient: ["#4d8e0a", "#76cb18", "#aff33e", "#e2ff85"],
    eyeColor: "#071003",
    accentColor: "#aff33e",
    blushColor: "rgba(255, 107, 107, 0.65)",
    particleColor: "#aff33e",
    friendlyDescription: "Hyper-Adaptive Career Agent",
  },
  // Companion: Soft pastel blue jelly blob inspired by the reference companion
  companion: {
    id: "companion",
    name: "Companion",
    glowColor: "rgba(147, 197, 253, 0.5)",
    ringColor: "rgba(125, 211, 252, 0.8)",
    bgGradient: ["#3b82f6", "#60a5fa", "#93c5fd", "#dbeafe"],
    eyeColor: "#0b101e",
    accentColor: "#93c5fd",
    blushColor: "rgba(251, 113, 133, 0.65)",
    particleColor: "#bae6fd",
    friendlyDescription: "Sweet Empathic Companion",
  },
  obsidian: {
    id: "obsidian",
    name: "Obsidian",
    glowColor: "rgba(139, 92, 246, 0.45)",
    ringColor: "rgba(168, 85, 247, 0.6)",
    bgGradient: ["#090d16", "#1e1b4b", "#312e81", "#6366f1"],
    eyeColor: "#c084fc",
    accentColor: "#a855f7",
    blushColor: "rgba(244, 114, 182, 0.6)",
    particleColor: "#e9d5ff",
    friendlyDescription: "Deep Cosmic Intelligence",
  },
  mana: {
    id: "mana",
    name: "Mana",
    glowColor: "rgba(6, 182, 212, 0.45)",
    ringColor: "rgba(14, 165, 233, 0.6)",
    bgGradient: ["#082f49", "#0c4a6e", "#0284c7", "#38bdf8"],
    eyeColor: "#67e8f9",
    accentColor: "#38bdf8",
    blushColor: "rgba(244, 114, 182, 0.55)",
    particleColor: "#cffafe",
    friendlyDescription: "Arcane Flow & Inspiration",
  },
  opal: {
    id: "opal",
    name: "Opal",
    glowColor: "rgba(236, 72, 153, 0.45)",
    ringColor: "rgba(244, 114, 182, 0.6)",
    bgGradient: ["#500724", "#701a75", "#db2777", "#f472b6"],
    eyeColor: "#f472b6",
    accentColor: "#ec4899",
    blushColor: "rgba(251, 113, 133, 0.7)",
    particleColor: "#fce7f3",
    friendlyDescription: "Warm Iridescent Empathy",
  },
  halo: {
    id: "halo",
    name: "Halo",
    glowColor: "rgba(245, 158, 11, 0.45)",
    ringColor: "rgba(251, 191, 36, 0.6)",
    bgGradient: ["#451a03", "#78350f", "#d97706", "#fbbf24"],
    eyeColor: "#fde047",
    accentColor: "#f59e0b",
    blushColor: "rgba(251, 146, 60, 0.6)",
    particleColor: "#fef9c3",
    friendlyDescription: "Radiant Golden Energy",
  },
  glint: {
    id: "glint",
    name: "Glint",
    glowColor: "rgba(16, 185, 129, 0.45)",
    ringColor: "rgba(52, 211, 153, 0.6)",
    bgGradient: ["#022c22", "#064e3b", "#059669", "#34d399"],
    eyeColor: "#6ee7b7",
    accentColor: "#10b981",
    blushColor: "rgba(244, 114, 182, 0.55)",
    particleColor: "#d1fae5",
    friendlyDescription: "Sharp Emerald Focus",
  },
  command: {
    id: "command",
    name: "Command",
    glowColor: "rgba(34, 197, 94, 0.5)",
    ringColor: "rgba(74, 222, 128, 0.7)",
    bgGradient: ["#052e16", "#14532d", "#16a34a", "#4ade80"],
    eyeColor: "#4ade80",
    accentColor: "#22c55e",
    blushColor: "rgba(244, 114, 182, 0.55)",
    particleColor: "#bbf7d0",
    friendlyDescription: "Cybernetic High-Performance",
  },
};

export function Persona({
  state = "idle",
  variant = "theme",
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
  const avatarRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [isJoyful, setIsJoyful] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hearts, setHearts] = useState<Array<{ id: number; x: number }>>([]);
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0, tiltX: 0, tiltY: 0 });

  // Fallback to signature volt-lime theme
  const theme = THEMES[variant] || THEMES.theme;

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

  // Real-time cursor following & fluid eye tracking
  useEffect(() => {
    if (typeof window === "undefined" || !interactive) return;

    let rafId: number;
    const handlePointerMove = (e: PointerEvent) => {
      rafId = requestAnimationFrame(() => {
        if (!avatarRef.current) return;
        const rect = avatarRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const dx = e.clientX - centerX;
        const dy = e.clientY - centerY;
        const distance = Math.hypot(dx, dy);

        // Clamped eye displacement inside jelly face
        const maxEyeDist = 4.2;
        const dampFactor = Math.min(distance / 260, 1.0);
        const angle = Math.atan2(dy, dx);

        const targetX = Math.cos(angle) * maxEyeDist * dampFactor;
        const targetY = Math.sin(angle) * maxEyeDist * dampFactor;

        // Subtle fluid tilt of the jelly body
        const tiltX = Math.max(Math.min(-dy / 25, 9), -9);
        const tiltY = Math.max(Math.min(dx / 25, 9), -9);

        setEyeOffset({ x: targetX, y: targetY, tiltX, tiltY });
      });
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [interactive]);

  // Organic natural blinking
  useEffect(() => {
    if (state === "asleep") return;

    let blinkTimeout: NodeJS.Timeout;
    const scheduleNextBlink = () => {
      const delay = 3000 + Math.random() * 2800;
      blinkTimeout = setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => {
          setIsBlinking(false);
          scheduleNextBlink();
        }, 130);
      }, delay);
    };

    scheduleNextBlink();
    return () => clearTimeout(blinkTimeout);
  }, [state]);

  // Squishy jelly bounce on click
  const handlePersonaClick = useCallback(() => {
    if (interactive) {
      setIsJoyful(true);
      const newHeart = { id: Date.now(), x: (Math.random() - 0.5) * 16 };
      setHearts((prev) => [...prev.slice(-3), newHeart]);

      setTimeout(() => setIsJoyful(false), 950);
    }
    onClick?.();
  }, [interactive, onClick]);

  // Jelly fluid morphing border-radius animation (NOT a rigid circle!)
  const jellyMorphVariants = useMemo(() => {
    switch (state) {
      case "listening":
        return {
          borderRadius: [
            "54% 46% 50% 50% / 46% 54% 46% 54%",
            "48% 52% 54% 46% / 54% 46% 54% 46%",
            "54% 46% 50% 50% / 46% 54% 46% 54%",
          ],
          scale: [1, 1.07, 1],
          transition: { repeat: Infinity, duration: 1.4, ease: "easeInOut" },
        };
      case "thinking":
        return {
          borderRadius: [
            "58% 42% 48% 52% / 44% 56% 44% 56%",
            "44% 56% 58% 42% / 56% 44% 56% 44%",
            "58% 42% 48% 52% / 44% 56% 44% 56%",
          ],
          rotate: [0, 6, -6, 0],
          scale: [1, 1.04, 1],
          transition: { repeat: Infinity, duration: 2.4, ease: "easeInOut" },
        };
      case "speaking":
        return {
          borderRadius: [
            "50% 50% 46% 54% / 52% 48% 52% 48%",
            "46% 54% 56% 44% / 46% 54% 46% 54%",
            "54% 46% 48% 52% / 54% 46% 54% 46%",
            "50% 50% 46% 54% / 52% 48% 52% 48%",
          ],
          scale: [1, 1.08, 0.96, 1.04, 1],
          transition: { repeat: Infinity, duration: 0.9, ease: "easeInOut" },
        };
      case "asleep":
        return {
          borderRadius: [
            "56% 44% 50% 50% / 50% 50% 48% 52%",
            "50% 50% 56% 44% / 48% 52% 50% 50%",
            "56% 44% 50% 50% / 50% 50% 48% 52%",
          ],
          scale: [1, 0.97, 1],
          transition: { repeat: Infinity, duration: 3.8, ease: "easeInOut" },
        };
      case "idle":
      default:
        return {
          // Continuous organic jelly fluid breathing
          borderRadius: [
            "56% 44% 54% 46% / 48% 54% 46% 52%",
            "46% 54% 44% 56% / 54% 46% 54% 46%",
            "52% 48% 58% 42% / 44% 56% 48% 52%",
            "48% 52% 46% 54% / 52% 48% 56% 44%",
            "56% 44% 54% 46% / 48% 54% 46% 52%",
          ],
          scale: [1, 1.03, 0.98, 1.02, 1],
          transition: { repeat: Infinity, duration: 4.2, ease: "easeInOut" },
        };
    }
  }, [state]);

  const stateFriendlyLabel = useMemo(() => {
    switch (state) {
      case "listening":
        return "Listening closely with full attention...";
      case "thinking":
        return "Thinking and synthesizing career insights...";
      case "speaking":
        return "Sharing tailored recommendations...";
      case "asleep":
        return "Resting peacefully (tap to wake me!)";
      case "idle":
      default:
        return "Always here to guide your career!";
    }
  }, [state]);

  const effectiveEyeX = useMemo(() => {
    if (state === "thinking") return eyeOffset.x * 0.4 + 1.2;
    if (state === "asleep") return 0;
    return eyeOffset.x;
  }, [eyeOffset.x, state]);

  const effectiveEyeY = useMemo(() => {
    if (state === "thinking") return eyeOffset.y * 0.4 - 2.5; // Look up thoughtfully
    if (state === "asleep") return 0;
    return eyeOffset.y;
  }, [eyeOffset.y, state]);

  const showBlush = isJoyful || isHovered || state === "speaking" || state === "listening";

  const content = (
    <div
      ref={avatarRef}
      data-testid="persona-avatar"
      data-persona-state={state}
      data-persona-variant={variant}
      onClick={handlePersonaClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "relative flex items-center justify-center select-none overflow-visible transition-transform duration-200",
        interactive && "cursor-pointer active:scale-90",
        className || "size-8"
      )}
      style={{
        perspective: 420,
        filter: `drop-shadow(0 0 14px ${theme.glowColor})`,
      }}
    >
      {/* Listening / Speaking Soundwave Ripple Rings */}
      <AnimatePresence>
        {(state === "listening" || state === "speaking") && (
          <>
            <motion.div
              initial={{ scale: 0.85, opacity: 0.8 }}
              animate={{ scale: 1.65, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ repeat: Infinity, duration: state === "speaking" ? 0.95 : 1.5, ease: "easeOut" }}
              className="absolute inset-0 rounded-full border border-dashed pointer-events-none"
              style={{ borderColor: theme.ringColor }}
            />
            <motion.div
              initial={{ scale: 0.85, opacity: 0.45 }}
              animate={{ scale: 2.2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ repeat: Infinity, duration: state === "speaking" ? 0.95 : 1.5, delay: 0.35, ease: "easeOut" }}
              className="absolute inset-0 rounded-full border pointer-events-none"
              style={{ borderColor: theme.ringColor }}
            />
          </>
        )}
      </AnimatePresence>

      {/* Thinking Orbiting Particles */}
      <AnimatePresence>
        {state === "thinking" && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2.2, ease: "linear" }}
            className="absolute inset-[-6px] pointer-events-none"
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

      {/* Floating Click Love Sparks */}
      <AnimatePresence>
        {hearts.map((h) => (
          <motion.div
            key={h.id}
            initial={{ opacity: 1, y: 0, scale: 0.6, x: h.x }}
            animate={{ opacity: 0, y: -26, scale: 1.25 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="absolute -top-1 pointer-events-none text-xs font-bold select-none"
            style={{ color: theme.accentColor }}
          >
            ✨
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Asleep Floating z Z */}
      <AnimatePresence>
        {state === "asleep" && (
          <motion.div
            initial={{ opacity: 0, y: 0, scale: 0.5 }}
            animate={{ opacity: [0, 1, 0], y: -18, scale: [0.6, 1, 1.2], x: [0, 5, 10] }}
            exit={{ opacity: 0 }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeOut" }}
            className="absolute -top-3.5 -right-2 text-[10px] font-bold pointer-events-none font-mono"
            style={{ color: theme.eyeColor }}
          >
            z Z
          </motion.div>
        )}
      </AnimatePresence>

      {/* The Jelly Blob Body — Non-circular organic fluid morphing */}
      <motion.div
        animate={
          isJoyful
            ? {
                scaleX: [1, 1.28, 0.82, 1.15, 0.94, 1.04, 1],
                scaleY: [1, 0.74, 1.22, 0.88, 1.08, 0.97, 1],
                rotate: [0, -6, 5, -3, 2, 0],
              }
            : jellyMorphVariants
        }
        className="relative size-full flex items-center justify-center overflow-hidden transition-all duration-150"
        style={{
          background: `radial-gradient(circle at 35% 26%, ${theme.bgGradient[3]} 0%, ${theme.bgGradient[2]} 52%, ${theme.bgGradient[1]} 85%, ${theme.bgGradient[0]} 100%)`,
          border: `1.5px solid ${theme.ringColor}`,
          boxShadow: `0 4px 18px ${theme.glowColor}, inset 0 2px 5px rgba(255,255,255,0.65), inset 0 -3px 8px rgba(0,0,0,0.25)`,
          transform: `rotateX(${eyeOffset.tiltX}deg) rotateY(${eyeOffset.tiltY}deg)`,
          transformStyle: "preserve-3d",
        }}
      >
        {/* Glossy Liquid Jelly Top Specular Reflection */}
        <div className="absolute top-1 left-1.5 w-5/12 h-1/3 rounded-full bg-gradient-to-br from-white/70 via-white/20 to-transparent blur-[0.6px] pointer-events-none" />

        {/* Jelly Bottom Bounce Light */}
        <div className="absolute bottom-0 inset-x-1 h-1/4 rounded-full bg-white/15 blur-[1px] pointer-events-none" />

        {/* Companion Face Canvas (36x36 coordinate space) */}
        <svg viewBox="0 0 36 36" className="size-full pointer-events-none overflow-visible" fill="none">
          {/* Sweet Rosy Cheeks (Blush) */}
          <g
            style={{
              opacity: showBlush ? 0.85 : 0,
              transition: "opacity 0.25s ease-in-out",
            }}
          >
            <circle cx="8.5" cy="22.5" r="3" fill={theme.blushColor} filter="blur(1px)" />
            <circle cx="27.5" cy="22.5" r="3" fill={theme.blushColor} filter="blur(1px)" />
          </g>

          {/* Eye Group with Smooth Cursor Following and Blinking */}
          <g
            style={{
              transform: `translate(${effectiveEyeX}px, ${effectiveEyeY}px)`,
              transformOrigin: "18px 18px",
              transition: "transform 0.08s ease-out",
            }}
          >
            {isJoyful ? (
              /* Joyful Squint Arcs: ^ ^ on click */
              <g stroke={theme.eyeColor} strokeWidth="2.8" strokeLinecap="round">
                <path d="M 11 19 Q 13.5 14.5 16 19" />
                <path d="M 20 19 Q 22.5 14.5 25 19" />
              </g>
            ) : state === "asleep" ? (
              /* Peaceful Sleeping Arcs: - - */
              <g stroke={theme.eyeColor} strokeWidth="2.4" strokeLinecap="round">
                <path d="M 11 18 Q 13.5 21 16 18" />
                <path d="M 20 18 Q 22.5 21 25 18" />
              </g>
            ) : (
              /* The Iconic Reference Companion Eyes: Two Slanted Capsule Eyes \ / */
              <g
                style={{
                  transform: isBlinking ? "scaleY(0.08)" : "scaleY(1)",
                  transformOrigin: "18px 18px",
                  transition: "transform 0.09s ease-in-out",
                }}
              >
                {/* Left Eye: Thick Capsule, slightly tilted clockwise like \ */}
                <rect
                  x="12"
                  y="13.5"
                  width="3.6"
                  height="9"
                  rx="1.8"
                  fill={theme.eyeColor}
                  transform="rotate(8 13.8 18)"
                />

                {/* Right Eye: Thick Capsule, slightly tilted counter-clockwise like / */}
                <rect
                  x="20.4"
                  y="13.5"
                  width="3.6"
                  height="9"
                  rx="1.8"
                  fill={theme.eyeColor}
                  transform="rotate(-6 22.2 18)"
                />
              </g>
            )}
          </g>
        </svg>
      </motion.div>
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="top" className="text-xs max-w-[210px] text-center border-white/10 bg-[#121217] text-white shadow-xl">
          <p className="font-semibold text-white flex items-center justify-center gap-1.5">
            <span className="size-2 rounded-full" style={{ backgroundColor: theme.accentColor }} />
            {theme.name} AI • {theme.friendlyDescription}
          </p>
          <p className="text-[11px] text-neutral-400 mt-0.5">{stateFriendlyLabel}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
