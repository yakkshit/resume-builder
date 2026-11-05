import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Labs | CedzLabs - Open Source Developer Tools & AI Agents",
  description:
    "Explore open-source developer tools, MCP servers, and autonomous AI agents built by CedzLabs. Including context-gen-cli and CareerAgent.",
  keywords: [
    "open source",
    "developer tools",
    "MCP server",
    "context-gen-cli",
    "CedzLabs",
    "AI agents",
    "CLI tools",
    "CareerAgent",
  ],
  alternates: {
    canonical: "https://resume.cedzlabs.com/labs",
  },
  openGraph: {
    title: "CedzLabs Labs - Open Source Developer Tools",
    description:
      "Building the future of developer tooling and agentic AI. All core products are open source.",
    url: "https://resume.cedzlabs.com/labs",
    siteName: "CedzLabs",
  },
};

export default function LabsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}

