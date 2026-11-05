"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Zap,
  Coins,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Server,
  Cpu,
  Clock,
  Mail,
  Check,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Persona } from "@/components/ai-elements/persona";
import { AiStarBadge } from "@/components/ui/ai-star";

export interface LoadTokensDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  userEmail?: string;
}

export function LoadTokensDialog({
  open,
  onOpenChange,
  trigger,
  userEmail = "",
}: LoadTokensDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [email, setEmail] = useState(userEmail);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const isControlled = open !== undefined;
  const currentOpen = isControlled ? open : internalOpen;
  const setOpen = (val: boolean) => {
    if (isControlled && onOpenChange) {
      onOpenChange(val);
    } else {
      setInternalOpen(val);
    }
  };

  const tokenPacks = [
    {
      id: "starter",
      name: "Starter Pack",
      tokens: "50,000",
      requests: "500 Tool Calls",
      price: "$5",
      badge: "Flexible Top-up",
      description: "Great for quick interview prep, resume audits, and light scraping.",
      features: [
        "50,000 AI tokens for heavy reasoning",
        "500 additional MCP & REST tool requests",
        "Full Master Memory Vault RAG access",
        "Never expires, stacks with daily 100 free requests",
      ],
      popular: false,
    },
    {
      id: "pro",
      name: "Pro Builder",
      tokens: "250,000",
      requests: "2,500 Tool Calls",
      price: "$19",
      badge: "Most Popular",
      description: "Ideal for active job seekers tailoring dozens of targeted applications.",
      features: [
        "250,000 AI tokens for DeepSeek & Claude reasoning",
        "2,500 MCP tool requests with zero rate limits",
        "Autonomous Playwright job portal scrapers",
        "Continuous vector ATS compliance verification",
      ],
      popular: true,
    },
    {
      id: "enterprise",
      name: "Power Agent",
      tokens: "1,000,000",
      requests: "10,000 Tool Calls",
      price: "$49",
      badge: "High Volume",
      description: "For agencies, power users, and autonomous multi-agent pipelines.",
      features: [
        "1,000,000 tokens for batch PDF & LaTeX rendering",
        "10,000 MCP & REST requests via dedicated bearer keys",
        "OAuth 2.0 multi-agent client credential pooling",
        "Priority VIP routing on resume.cedzlabs.com",
      ],
      popular: false,
    },
  ];

  const handleJoinWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast({
        title: "Please enter a valid email",
        description: "We will notify you as soon as token loading goes live.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem("cedzlabs_tokens_waitlist_email", email);
        }
      } catch {}

      toast({
        title: "You are on the VIP Token Waitlist!",
        description: "We'll notify you first when token loading goes live on resume.cedzlabs.com.",
      });
    }, 600);
  };

  return (
    <Dialog open={currentOpen} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-2xl bg-[#0c0c10] border border-white/10 text-white p-0 overflow-hidden shadow-2xl rounded-2xl sm:max-h-[90vh] flex flex-col">
        {/* Header Banner */}
        <div className="relative p-6 bg-gradient-to-b from-[#181822] to-[#0c0c10] border-b border-white/[0.08] shrink-0">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Coins className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Load Tokens &amp; Quota Top-up</span>
                  <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px] font-mono uppercase tracking-wide">
                    Coming Soon...
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-neutral-400">
                  Recharge tokens for AI reasoning, high-volume MCP requests, and automated scraping on resume.cedzlabs.com.
                </DialogDescription>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <AiStarBadge size="sm" />
            </div>
          </div>

          {/* Current Daily Quota Banner */}
          <div className="mt-3 p-2.5 rounded-xl border border-white/[0.06] bg-black/40 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-neutral-300">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Current Free Admin Quota:</span>
              <strong className="text-white font-mono">100 Requests/Day Free</strong>
            </div>
            <span className="text-[11px] text-neutral-400 font-mono">Resets Daily at 00:00 UTC</span>
          </div>
        </div>

        {/* Scrollable Content: Packs & Waitlist */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 min-h-0">
          {/* Token Packages Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {tokenPacks.map((pack) => (
              <div
                key={pack.id}
                className={`relative rounded-xl p-4 flex flex-col justify-between transition-all border ${
                  pack.popular
                    ? "border-primary/50 bg-gradient-to-b from-[#141d10] to-[#0e0e13] shadow-lg shadow-primary/10"
                    : "border-white/[0.08] bg-[#121217] hover:border-white/20"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white">{pack.name}</span>
                    <Badge
                      variant="outline"
                      className={`text-[9px] font-mono ${
                        pack.popular
                          ? "bg-primary/20 text-primary border-primary/30 font-semibold"
                          : "bg-white/5 text-neutral-400 border-white/10"
                      }`}
                    >
                      {pack.badge}
                    </Badge>
                  </div>

                  <div className="mb-2">
                    <span className="text-2xl font-black text-white">{pack.price}</span>
                    <span className="text-[10px] text-neutral-400 font-mono ml-1">/ one-time</span>
                  </div>

                  <div className="space-y-1 mb-3 pb-3 border-b border-white/5">
                    <div className="text-xs font-semibold text-amber-300 flex items-center gap-1">
                      <Zap className="size-3" />
                      <span>{pack.tokens} Tokens</span>
                    </div>
                    <div className="text-[11px] text-neutral-400 font-mono">
                      + {pack.requests}
                    </div>
                  </div>

                  <ul className="space-y-1.5 text-[11px] text-neutral-300">
                    {pack.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-1.5 leading-snug">
                        <Check className="size-3 text-primary shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    className="w-full h-8 text-xs font-medium border-white/10 bg-white/[0.04] text-neutral-400 cursor-not-allowed"
                  >
                    <span>Coming Soon...</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Waitlist Callout Banner */}
          <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-[#181822] to-primary/10 p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-amber-400" />
                  <h4 className="text-sm font-bold text-white">
                    Need Higher Quota Today? Get Priority Token Access
                  </h4>
                </div>
                <p className="text-xs text-neutral-400 max-w-md">
                  Leave your email to be the first notified when instant Stripe/PayPal token top-ups launch on <code className="text-white font-mono text-[11px]">resume.cedzlabs.com</code>.
                </p>
              </div>

              {isSubmitted ? (
                <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-xl px-3.5 py-2 text-xs font-medium shrink-0">
                  <CheckCircle2 className="size-4 text-emerald-400" />
                  <span>VIP Waitlist Joined!</span>
                </div>
              ) : (
                <form onSubmit={handleJoinWaitlist} className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@cedzlabs.com"
                    required
                    className="h-8 text-xs bg-black/60 border-white/15 text-white max-w-[200px]"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSubmitting}
                    className="h-8 px-3 text-xs font-bold bg-amber-400 text-black hover:bg-amber-300 shrink-0"
                  >
                    <span>{isSubmitting ? "Joining..." : "Notify Me"}</span>
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

