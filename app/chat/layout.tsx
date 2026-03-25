import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Career Chat | AI Resume",
  description:
    "Chat with AI for cover letters, CV scoring, job links, mock interviews, and more.",
};

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="-mt-2 -mb-8 flex min-h-0 flex-1 flex-col overflow-hidden h-[calc(100dvh-5rem)] max-h-[calc(100dvh-5rem)]">
      {children}
    </div>
  );
}
