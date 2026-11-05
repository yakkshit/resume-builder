"use client";

import React, { useState, useEffect } from "react";
import {
  Wallet,
  Coins,
  Gift,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Heart,
  Clock,
  ExternalLink,
  Tag,
  Copy,
  Info,
  Layers,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface WalletTransaction {
  id: string;
  code: string;
  amount: number;
  date: string;
  description: string;
}

const DEFAULT_TRANSACTIONS: WalletTransaction[] = [
  {
    id: "tx-welcome-001",
    code: "WELCOME_CREDIT",
    amount: 1000,
    date: new Date().toLocaleDateString(),
    description: "Welcome beta user allocation",
  },
];

const VALID_PROMO_CODES: Record<string, { amount: number; label: string }> = {
  BETA2026: { amount: 1000, label: "Beta 2026 Early Adopter" },
  CEDZLABS: { amount: 2500, label: "CedzLabs Developer Grant" },
  AIAGENT: { amount: 500, label: "Agent Platform Explorer" },
  SUPERDEV: { amount: 5000, label: "SuperDev Career Bonus" },
  YAKKSHIT: { amount: 10000, label: "Founder Special Pass" },
  LAUNCH100: { amount: 1500, label: "Launch 100 Celebration" },
};

export function WalletAndPlansTab() {
  const { toast } = useToast();
  const [promoInput, setPromoInput] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [balance, setBalance] = useState<number>(1000);
  const [transactions, setTransactions] = useState<WalletTransaction[]>(DEFAULT_TRANSACTIONS);
  const [redeemedCodes, setRedeemedCodes] = useState<string[]>([]);
  const [selectedDonationTier, setSelectedDonationTier] = useState<number>(15);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedBal = localStorage.getItem("career_agent_wallet_balance");
      if (storedBal) {
        setBalance(parseInt(storedBal, 10));
      }
      const storedTx = localStorage.getItem("career_agent_wallet_tx");
      if (storedTx) {
        setTransactions(JSON.parse(storedTx));
      }
      const storedRedeemed = localStorage.getItem("career_agent_wallet_redeemed");
      if (storedRedeemed) {
        setRedeemedCodes(JSON.parse(storedRedeemed));
      }
    } catch {}
  }, []);

  // Save changes
  const saveWallet = (newBal: number, newTx: WalletTransaction[], newRedeemed: string[]) => {
    setBalance(newBal);
    setTransactions(newTx);
    setRedeemedCodes(newRedeemed);
    try {
      localStorage.setItem("career_agent_wallet_balance", String(newBal));
      localStorage.setItem("career_agent_wallet_tx", JSON.stringify(newTx));
      localStorage.setItem("career_agent_wallet_redeemed", JSON.stringify(newRedeemed));
    } catch {}
  };

  const handleRedeemPromo = () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) {
      toast({
        variant: "destructive",
        title: "Enter a Promo Code",
        description: "Please type or select a promo code to load tokens.",
      });
      return;
    }

    if (redeemedCodes.includes(code)) {
      toast({
        variant: "destructive",
        title: "Code Already Redeemed",
        description: `Promo code "${code}" has already been used on this account.`,
      });
      return;
    }

    const reward = VALID_PROMO_CODES[code];
    if (!reward) {
      toast({
        variant: "destructive",
        title: "Invalid Promo Code",
        description: `"${code}" is not recognized. Try BETA2026, CEDZLABS, or AIAGENT.`,
      });
      return;
    }

    setIsRedeeming(true);
    setTimeout(() => {
      const newBal = balance + reward.amount;
      const newTxItem: WalletTransaction = {
        id: `tx-${Date.now()}`,
        code,
        amount: reward.amount,
        date: new Date().toLocaleDateString(),
        description: `${reward.label} (+${reward.amount.toLocaleString()} Tokens)`,
      };
      const updatedTx = [newTxItem, ...transactions];
      const updatedRedeemed = [...redeemedCodes, code];

      saveWallet(newBal, updatedTx, updatedRedeemed);
      setIsRedeeming(false);
      setPromoInput("");

      toast({
        title: "Tokens Loaded Successfully! 🎉",
        description: `Added +${reward.amount.toLocaleString()} tokens to your wallet using "${code}".`,
      });
    }, 600);
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* ── CARD 1: WALLET & TOKEN BALANCE ────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#16161a] p-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/[0.06]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Wallet className="size-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  Personal Token Wallet
                  <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-300 border-amber-500/25">
                    Live Balance
                  </Badge>
                </h2>
                <p className="text-xs text-neutral-400">
                  Tokens power AI multi-agent reasoning, deep research, and high-frequency MCP executions.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="p-4 rounded-xl bg-[#111114] border border-white/[0.06] min-w-[160px] text-right">
              <div className="text-[10px] text-neutral-500 font-medium uppercase tracking-wider">Available Balance</div>
              <div className="text-2xl font-black text-amber-300 font-mono mt-0.5 flex items-center justify-end gap-1.5">
                <Coins className="size-5 text-amber-400" />
                {balance.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Promo Code Loader Input */}
        <div className="mt-6 pt-2 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-white flex items-center gap-2">
              <Gift className="size-3.5 text-amber-400" />
              Load Tokens via Promo Code
            </label>
            <p className="text-xs text-neutral-400">
              Enter an event voucher, early-access pass, or promotional code to top up tokens instantly.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-md">
            <div className="relative flex-1">
              <Tag className="absolute left-3 top-2.5 size-4 text-neutral-500" />
              <Input
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                placeholder="e.g. BETA2026, CEDZLABS"
                className="pl-9 h-10 text-xs font-mono uppercase bg-[#111114] border-white/[0.08] text-white"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRedeemPromo();
                }}
              />
            </div>
            <Button
              type="button"
              onClick={handleRedeemPromo}
              disabled={isRedeeming || !promoInput.trim()}
              className="h-10 px-5 text-xs font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black rounded-xl shadow-md transition-all shrink-0"
            >
              {isRedeeming ? "Applying..." : "Redeem Code"}
            </Button>
          </div>

          {/* Suggested Promo Codes for Beta Users */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] text-neutral-500">Popular promo codes:</span>
            {["BETA2026", "CEDZLABS", "AIAGENT", "SUPERDEV"].map((code) => {
              const alreadyUsed = redeemedCodes.includes(code);
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => setPromoInput(code)}
                  disabled={alreadyUsed}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-md border transition-all ${
                    alreadyUsed
                      ? "bg-white/[0.02] border-white/[0.05] text-neutral-600 line-through cursor-not-allowed"
                      : "bg-[#16161c] border-amber-500/25 text-amber-300 hover:bg-amber-500/10 cursor-pointer"
                  }`}
                >
                  {code} {alreadyUsed ? "(Used)" : `(+${VALID_PROMO_CODES[code]?.amount.toLocaleString()})`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Transaction History */}
        <div className="mt-8 pt-6 border-t border-white/[0.06] space-y-3">
          <h3 className="text-xs font-semibold text-neutral-300 flex items-center gap-2">
            <Clock className="size-3.5 text-neutral-400" />
            Wallet Activity &amp; Redemptions
          </h3>
          <div className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-[#111114] border border-white/[0.04] text-xs"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-medium text-white">{tx.description}</div>
                    <div className="text-[10px] text-neutral-500 font-mono">
                      {tx.code} • {tx.date}
                    </div>
                  </div>
                </div>
                <div className="font-mono font-bold text-emerald-400">
                  +{tx.amount.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CARD 2: PLANS & TIERS (BETA PREVIEW - COMING SOON) ───────────────────── */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">Workspace Plans &amp; Tiers</h3>
            <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-[10px]">
              Beta Preview • Coming Soon
            </Badge>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            During public beta, all core workspace tools, Model Context Protocol endpoints, and ATS engines are 100% free. Paid subscription gateways are previewed below.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Free Starter */}
          <div className="p-5 rounded-2xl border border-white/10 bg-[#16161a] space-y-4 shadow-lg relative flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Current Plan</span>
                <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-300 border-emerald-500/25">
                  Active
                </Badge>
              </div>
              <div className="text-xl font-bold text-white">Free Starter</div>
              <div className="text-2xl font-black text-white font-mono">
                $0 <span className="text-xs font-normal text-neutral-400">/ forever</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Complete career workspace with full AI resume tailoring, vector RAG grounding, and personal MCP.
              </p>
              <div className="space-y-2 pt-3 border-t border-white/[0.06] text-xs text-neutral-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                  <span>100 MCP requests / day</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                  <span>Full Memory Vault RAG storage</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                  <span>Bring Your Own Key (BYOK)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                  <span>All 10+ Vector ATS PDF templates</span>
                </div>
              </div>
            </div>
            <Button
              size="sm"
              disabled
              variant="outline"
              className="w-full mt-4 h-9 text-xs border-white/10 text-neutral-400 bg-white/5 cursor-default"
            >
              Current Active Plan
            </Button>
          </div>

          {/* Pro Engineer (Beta Preview) */}
          <div className="p-5 rounded-2xl border border-indigo-500/30 bg-gradient-to-b from-indigo-950/20 to-[#16161a] space-y-4 shadow-xl relative flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400">Recommended</span>
                <Badge className="bg-indigo-600 text-white text-[10px]">
                  Coming Soon
                </Badge>
              </div>
              <div className="text-xl font-bold text-white">Pro Engineer</div>
              <div className="text-2xl font-black text-white font-mono">
                $12 <span className="text-xs font-normal text-neutral-400">/ month</span>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Elevated daily rate limits, automated cloud synchronization, and dedicated multi-agent harnesses.
              </p>
              <div className="space-y-2 pt-3 border-t border-white/[0.06] text-xs text-neutral-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-indigo-400 shrink-0" />
                  <span>500 MCP requests / day</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-indigo-400 shrink-0" />
                  <span>Priority Gemini 4 Argon reasoning</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-indigo-400 shrink-0" />
                  <span>Automated GitHub sync &amp; versioning</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-indigo-400 shrink-0" />
                  <span>Custom agent harness builder</span>
                </div>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() =>
                toast({
                  title: "Pro Waitlist Registered",
                  description: "You are on the Pro waitlist! During public beta, core features remain free.",
                })
              }
              className="w-full mt-4 h-9 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md transition-all"
            >
              Join Pro Waitlist (Free)
            </Button>
          </div>

          {/* Team & Studio (Beta Preview) */}
          <div className="p-5 rounded-2xl border border-white/10 bg-[#16161a] space-y-4 shadow-lg relative flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-400">Organizations</span>
                <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-300 border-purple-500/25">
                  In Design
                </Badge>
              </div>
              <div className="text-xl font-bold text-white">Team &amp; Studio</div>
              <div className="text-2xl font-black text-white font-mono">
                $49 <span className="text-xs font-normal text-neutral-400">/ month</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                For career coaches, engineering teams, and recruiting studios managing multiple candidate dossiers.
              </p>
              <div className="space-y-2 pt-3 border-t border-white/[0.06] text-xs text-neutral-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-purple-400 shrink-0" />
                  <span>Shared Team Memory Vaults</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-purple-400 shrink-0" />
                  <span>Dedicated custom domain MCP</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-purple-400 shrink-0" />
                  <span>Role-based access &amp; audit telemetry</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-purple-400 shrink-0" />
                  <span>SAML SSO / enterprise auth</span>
                </div>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() =>
                toast({
                  title: "Team Studio Interest Recorded",
                  description: "Thanks for your interest! Team features are launching in v2.2.",
                })
              }
              variant="outline"
              className="w-full mt-4 h-9 text-xs border-purple-500/30 text-purple-300 hover:bg-purple-500/10 rounded-xl transition-all"
            >
              Request Studio Early Access
            </Button>
          </div>
        </div>
      </div>

      {/* ── CARD 3: COMMUNITY DONATION & OPEN-SOURCE SUPPORT ────────────────────── */}
      <div className="rounded-2xl border border-rose-500/25 bg-gradient-to-b from-rose-950/15 to-[#16161a] p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Heart className="size-4 text-rose-400 fill-rose-500/30" />
              Support Open-Source &amp; Server Infrastructure
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed max-w-2xl">
              CareerAgent is built and maintained open-source by Yakkshit Reddy. 100% of community contributions fund persistent serverless cloud execution, MCP hosting, and vector embeddings.
            </p>
          </div>

          <a
            href="/donate"
            className="text-xs text-rose-300 hover:text-white flex items-center gap-1 font-medium underline underline-offset-4 shrink-0"
          >
            Full Donation Overview <ArrowRight className="size-3" />
          </a>
        </div>

        {/* Donation Tiers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { amount: 5, label: "Coffee Supporter ☕", note: "Helps cover serverless hosting costs" },
            { amount: 15, label: "Compute Sponsor 🚀", note: "Funds Model Context Protocol uptime" },
            { amount: 50, label: "Open-Source Patron 🌟", note: "Sponsors feature research & updates" },
          ].map((tier) => (
            <button
              key={tier.amount}
              type="button"
              onClick={() => setSelectedDonationTier(tier.amount)}
              className={`p-4 rounded-xl border text-left transition-all ${
                selectedDonationTier === tier.amount
                  ? "bg-rose-500/15 border-rose-500/50 shadow-lg"
                  : "bg-[#111114] border-white/[0.06] hover:border-white/20"
              }`}
            >
              <div className="text-xl font-bold text-white font-mono">€{tier.amount}</div>
              <div className="text-xs font-semibold text-rose-300 mt-1">{tier.label}</div>
              <div className="text-[10px] text-neutral-400 mt-0.5">{tier.note}</div>
            </button>
          ))}
        </div>

        {/* PayLink Checkout Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-white/[0.06]">
          <div className="text-xs text-neutral-400 flex items-center gap-2">
            <ShieldCheck className="size-4 text-emerald-400" />
            Secure payment link processed directly by CedzLabs.
          </div>

          <a
            href="https://www.cedzlabs.com//_paylink/AZWlkIpg"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/30 transition-all active:scale-95 shrink-0"
          >
            <span>Donate €{selectedDonationTier} via CedzLabs PayLink</span>
            <ExternalLink className="size-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}

