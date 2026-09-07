"use client";

import { useEffect, useState } from "react";
import AICareerAssistantChat from "@/components/chat/ai-chat";

export default function ChatPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2 px-4 text-center text-sm text-muted-foreground">
        <p>Loading career assistant…</p>
      </div>
    );
  }

  return <AICareerAssistantChat />;
}
