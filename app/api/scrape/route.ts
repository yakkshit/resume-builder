import { NextRequest, NextResponse } from "next/server";
import { resilientScrape } from "@/lib/scrapers/resilient-scraper";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, apiKeyFirecrawl, apiKeyTavily } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Target URL is required" }, { status: 400 });
    }

    const plan = await resilientScrape(url, {
      apiKeyFirecrawl,
      apiKeyTavily,
    });

    return NextResponse.json({ ok: true, plan });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to execute resilient scrape" },
      { status: 500 }
    );
  }
}
