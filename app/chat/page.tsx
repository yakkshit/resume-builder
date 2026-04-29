"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

const AICareerAssistantChat = dynamic(
  () => import("@/components/chat/ai-chat").then((m) => m.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2 px-4 text-center text-sm text-muted-foreground">
        <p>Loading career assistant…</p>
        <p className="text-xs opacity-80">
          If this hangs, hard-refresh the page (dev server restarts can invalidate old JS chunks).
        </p>
      </div>
    ),
  },
);

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">Loading…</div>
      }
    >
      <AICareerAssistantChat />
    </Suspense>
  );
}
