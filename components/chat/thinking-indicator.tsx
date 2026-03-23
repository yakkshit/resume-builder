"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[#1a1a1e]/80 border border-[#1172e2]/20 backdrop-blur-sm px-4 py-3">
      <motion.div
        animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#1172e2] text-white"
      >
        <Sparkles className="h-4 w-4" />
      </motion.div>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-white">Thinking...</p>
        <div className="flex gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <motion.span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-[#1172e2]/70"
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
