"use client";

import { motion } from "framer-motion";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black text-white selection:bg-white/20 select-none">
      <div className="relative flex flex-col items-center">
        {/* Subtle breathing brand mark */}
        <div className="relative flex items-center justify-center mb-6">
          <motion.div
            className="size-10 rounded-full border border-white/10 bg-[#070709] flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.05)]"
            animate={{
              scale: [1, 1.05, 1],
              borderColor: ["rgba(255,255,255,0.1)", "rgba(175,243,62,0.4)", "rgba(255,255,255,0.1)"],
            }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          >
            <span className="size-2.5 rounded-full bg-[#aff33e] shadow-[0_0_10px_#aff33e]" />
          </motion.div>
        </div>

        {/* Brand label */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm font-semibold tracking-tight text-white">CareerAgent</span>
          <span className="text-[10px] font-mono text-zinc-500 border border-white/10 px-1.5 py-0.2 rounded">
            v2.0
          </span>
        </div>

        {/* Minimalist indeterminate progress bar */}
        <div className="w-36 h-[2px] bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-transparent via-[#aff33e] to-transparent"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{
              duration: 1.2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
        </div>
      </div>
    </div>
  );
}
