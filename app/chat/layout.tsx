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
    <div className="-mt-2 -mb-8 h-[calc(100vh-5rem)] min-h-0 flex flex-col overflow-hidden">
      {children}
    </div>
  );
}
