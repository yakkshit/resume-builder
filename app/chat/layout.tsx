import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Career Assistant — Chat",
  description: "Chat with your AI career assistant for resume, jobs, and interviews",
};

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Isolated layout: no AppNav, no padding, full viewport
  return <div className="w-full h-screen overflow-hidden">{children}</div>;
}
