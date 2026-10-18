"use client";

import dynamic from "next/dynamic";
import ChatLoading from "./loading";

const AICareerAssistantChat = dynamic(() => import("@/components/chat/ai-chat"), {
  ssr: false,
  loading: () => <ChatLoading />,
});

export default function ChatPage() {
  return <AICareerAssistantChat />;
}

