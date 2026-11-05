import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing Plans | CareerAgent — Autonomous Career OS",
  description:
    "Explore transparent, flexible pricing for CareerAgent. Start with 100 free requests per day or upgrade to Pro for unlimited AI tailoring and agentic MCP workflows.",
  alternates: {
    canonical: "https://resume.cedzlabs.com/price",
  },
  openGraph: {
    title: "Pricing Plans | CareerAgent — Autonomous Career OS",
    description:
      "100 free daily requests, dedicated MCP servers, and vector ATS resumes. Upgrade to Pro for unlimited autonomous job applications.",
    url: "https://resume.cedzlabs.com/price",
    siteName: "CareerAgent",
  },
};

export default function PriceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
