"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export function ThinkingIndicator() {
  return (
    <div
      className="flex items-center gap-3 rounded-2xl border border-border bg-muted/60 px-4 py-3 shadow-sm backdrop-blur-md dark:border-[#1172e2]/25 dark:bg-gradient-to-br dark:from-[#1a1a1e]/95 dark:to-[#12121a]/90 dark:shadow-[0_12px_40px_-20px_rgba(17,114,226,0.35)]"
      role="status"
      aria-live="polite"
      aria-label="Assistant is thinking"
    >
      <motion.div
        animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground dark:bg-[#1172e2] dark:text-white"
      >
        <Sparkles className="h-4 w-4" />
      </motion.div>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-foreground dark:text-white">Thinking…</p>
        <div className="flex gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <motion.span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-primary/70 dark:bg-[#1172e2]/70"
              animate={{
                opacity: [0.4, 1, 0.4],
                scale: [0.9, 1.1, 0.9],
              }}
              transition={{
                repeat: Infinity,
                duration: 0.8,
                delay: i * 0.15,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
