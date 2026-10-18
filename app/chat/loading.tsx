import React from "react";
import { Sparkles } from "lucide-react";

export default function ChatLoading() {
  return (
    <div className="relative z-[1] flex h-full min-h-0 w-full flex-row overflow-hidden bg-[#161619] select-none">
      {/* Desktop Sidebar Skeleton */}
      <aside className="hidden md:flex flex-col justify-between w-64 h-full bg-[#141416] border-r border-white/5 shrink-0 p-3.5">
        <div className="flex flex-col space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
                <Sparkles className="size-3.5 animate-pulse" />
              </div>
              <span className="font-bold text-sm tracking-tight text-white/90">Career Studio</span>
            </div>
            <div className="size-6 rounded-md bg-white/5 animate-pulse" />
          </div>

          {/* New Chat Button */}
          <div className="h-9 w-full rounded-xl bg-white/5 border border-white/10 flex items-center px-3 gap-2.5">
            <div className="size-4 rounded bg-white/10 animate-pulse" />
            <div className="h-3.5 w-20 rounded bg-white/10 animate-pulse" />
          </div>

          {/* Recent Chats Skeleton List */}
          <div className="space-y-2 pt-2">
            <div className="h-3 w-16 rounded bg-white/5 animate-pulse ml-1 mb-2" />
            <div className="h-8 w-full rounded-lg bg-white/5 animate-pulse" />
            <div className="h-8 w-full rounded-lg bg-white/5/60 animate-pulse" />
            <div className="h-8 w-full rounded-lg bg-white/5/40 animate-pulse" />
            <div className="h-8 w-full rounded-lg bg-white/5/20 animate-pulse" />
          </div>
        </div>

        {/* User Profile Pill Skeleton */}
        <div className="pt-3 border-t border-white/5 flex items-center gap-2.5 px-1">
          <div className="size-8 rounded-full bg-white/10 animate-pulse shrink-0" />
          <div className="flex-1 space-y-1.5 min-w-0">
            <div className="h-3 w-24 rounded bg-white/10 animate-pulse" />
            <div className="h-2.5 w-16 rounded bg-white/5 animate-pulse" />
          </div>
        </div>
      </aside>

      {/* Main Chat Column Skeleton */}
      <main className="flex-1 flex flex-col h-full min-w-0 bg-[#161619] relative overflow-hidden">
        {/* Top Header */}
        <header className="h-12 border-b border-white/5 px-4 flex items-center justify-between shrink-0 bg-[#141416]/60">
          <div className="flex items-center gap-2">
            <div className="h-6 w-32 rounded-lg bg-white/10 animate-pulse" />
          </div>
          <div className="flex items-center gap-1.5">
            <div className="size-8 rounded-lg bg-white/5 animate-pulse" />
            <div className="size-8 rounded-lg bg-white/5 animate-pulse" />
          </div>
        </header>

        {/* Center Welcome Hero & Capsule Input Skeleton (matches Qwen inspiration) */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-2xl mx-auto w-full">
          <div className="-mt-12 sm:-mt-20 w-full flex flex-col items-center">
            {/* "How can I help you?" text placeholder */}
            <div className="h-9 w-64 rounded-xl bg-white/10 animate-pulse mb-8" />

            {/* Centered Capsule Input Pill Skeleton */}
            <div className="w-full h-12 rounded-full border border-white/10 bg-[#1e1e22]/90 flex items-center justify-between px-3 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="size-6 rounded-full bg-white/10 animate-pulse" />
                <div className="h-4 w-52 rounded bg-white/5 animate-pulse" />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-6 w-16 rounded-full bg-white/5 animate-pulse" />
                <div className="size-7 rounded-full bg-white/5 animate-pulse" />
                <div className="size-7 rounded-full bg-white/10 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
