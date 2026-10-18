import { NextRequest, NextResponse } from "next/server";
import { performWebSearch, searchWithTavily, searchWithFirecrawl } from "@/lib/web-search";

export const dynamic = "force-dynamic";

/**
 * GET /api/search?test=1&provider=tavily&key=...
 * Used by Profile Dashboard to test/verify API keys.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const isTest = searchParams.get("test") === "1";
  const provider = searchParams.get("provider");
  const key = searchParams.get("key")?.trim() || "";

  if (isTest) {
    if (!key) {
      return NextResponse.json({ ok: false, error: "API key is required for testing." }, { status: 400 });
    }

    try {
      if (provider === "tavily") {
        const testRes = await searchWithTavily("Next.js", key, { maxResults: 1 });
        return NextResponse.json({ ok: true, provider: "tavily", resultsCount: testRes.resultsCount });
      } else if (provider === "firecrawl") {
        const testRes = await searchWithFirecrawl("Next.js", key, { maxResults: 1 });
        return NextResponse.json({ ok: true, provider: "firecrawl", resultsCount: testRes.resultsCount });
      } else {
        return NextResponse.json({ ok: false, error: "Unknown search provider" }, { status: 400 });
      }
    } catch (err: any) {
      return NextResponse.json({ ok: false, error: err?.message || "Validation failed" }, { status: 400 });
    }
  }

  return NextResponse.json({ ok: true, message: "Search API active" });
}

/**
 * POST /api/search
 * Executes web search using Tavily or Firecrawl
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, options } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const searchResponse = await performWebSearch(query, options);
    return NextResponse.json(searchResponse);
  } catch (error: any) {
    console.error("Web search error:", error);
    return NextResponse.json({ error: error?.message || "Internal search error" }, { status: 500 });
  }
}
