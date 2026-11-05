"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Wallet } from "lucide-react";
import { WalletAndPlansTab } from "@/components/profile/wallet-and-plans-tab";
import { Button } from "@/components/ui/button";

export default function PayAndWalletPage() {
  return (
    <div className="min-h-screen bg-[#0e0e11] text-white flex flex-col">
      <header className="border-b border-white/[0.08] bg-[#121216]/90 backdrop-blur-md sticky top-0 z-20 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/profile">
              <Button variant="ghost" size="sm" className="h-8 px-2.5 text-xs text-neutral-400 hover:text-white">
                <ArrowLeft className="size-4 mr-1.5" /> Back to Profile
              </Button>
            </Link>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <Wallet className="size-4 text-amber-400" />
              <span className="text-sm font-bold text-white">Wallet, Plans &amp; Donations</span>
            </div>
          </div>

          <Link href="/chat">
            <Button size="sm" variant="outline" className="h-8 text-xs border-white/10 text-neutral-300">
              Return to Chat
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8">
        <WalletAndPlansTab />
      </main>
    </div>
  );
}

