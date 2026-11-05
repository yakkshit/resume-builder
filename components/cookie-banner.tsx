"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const CONSENT_STORAGE_NAME = "cedzlabs_cookie_consent_v2";

export function CookieBanner() {
  const [mounted, setMounted] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const consent = localStorage.getItem(CONSENT_STORAGE_NAME);
      if (!consent) {
        // Small delay so it animates in smoothly after load
        const timer = setTimeout(() => setShowBanner(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, []);

  const handleConsent = (type: "all" | "essential") => {
    try {
      localStorage.setItem(CONSENT_STORAGE_NAME, JSON.stringify({ type, timestamp: Date.now() }));
    } catch {}
    setShowBanner(false);
  };

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.aside
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 rounded-2xl border border-white/10 bg-[#09090c]/95 backdrop-blur-2xl p-4 shadow-[0_12px_40px_rgba(0,0,0,0.8)] text-zinc-300 select-none"
          role="region"
          aria-label="Cookie consent banner"
        >
          <div className="flex items-start justify-between gap-3 mb-2.5">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white shrink-0">
                <Cookie className="size-3.5 text-zinc-300" />
              </div>
              <span className="text-xs font-semibold text-white tracking-tight">Privacy &amp; Cookie Preferences</span>
            </div>
            <button
              type="button"
              onClick={() => handleConsent("essential")}
              className="text-zinc-500 hover:text-white p-1 transition-colors"
              aria-label="Dismiss banner"
            >
              <X className="size-3.5" />
            </button>
          </div>

          <p className="text-[11px] text-zinc-400 leading-relaxed mb-3.5 font-normal">
            CareerAgent uses essential local storage for your Master Memory Vault and offline resume drafts. We never sell your personal data.
          </p>

          <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
            <span className="text-[10px] text-zinc-500 flex items-center gap-1 font-mono">
              <ShieldCheck className="size-3 text-[#aff33e]" />
              <span>Zero-knowledge client encrypted</span>
            </span>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleConsent("essential")}
                className="h-7 px-2.5 text-[11px] font-medium text-zinc-400 hover:text-white rounded-lg"
              >
                Essential Only
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => handleConsent("all")}
                className="h-7 px-3 text-[11px] font-semibold rounded-lg bg-white text-black hover:bg-zinc-200 transition-all shadow-none"
              >
                Accept All
              </Button>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

export default CookieBanner;
