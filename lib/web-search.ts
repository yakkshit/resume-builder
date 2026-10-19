/**
 * Web Search Service (Tavily AI Search & Firecrawl Web Scraper)
 * Implements official agent specifications:
 * - Tavily: https://tavily.com/agent-setup/SKILL.md
 * - Firecrawl: https://www.firecrawl.dev/agent-onboarding/SKILL.md
 */

export interface WebSearchResult {
  id: string;
  url: string;
  title: string;
  snippet: string;
  domain: string;
  favicon?: string;
  score?: number;
  publishedDate?: string;
  provider: "tavily" | "firecrawl" | "simulated";
}

export interface WebSearchResponse {
  query: string;
  domains: string[];
  resultsCount: number;
  results: WebSearchResult[];
  answer?: string;
  provider: "tavily" | "firecrawl" | "simulated";
}

export interface WebSearchOptions {
  apiKeyTavily?: string;
  apiKeyFirecrawl?: string;
  includeDomains?: string[];
  excludeDomains?: string[];
  maxResults?: number;
  searchDepth?: "basic" | "advanced";
}

/**
 * Extracts domain from URL safely
 */
export function extractDomain(url: string): string {
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return url.split("/")[0]?.replace(/^www\./, "") || "web";
  }
}

/**
 * Generates reliable Google Favicon URL for a domain
 */
export function getFaviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
}

/**
 * Tavily AI Search Implementation
 * POST https://api.tavily.com/search
 */
export async function searchWithTavily(
  query: string,
  apiKey: string,
  options?: WebSearchOptions
): Promise<WebSearchResponse> {
  const cleanKey = apiKey.trim().replace(/^Bearer\s+/i, "");
  const maxResults = options?.maxResults ?? 10;
  const searchDepth = options?.searchDepth ?? "advanced";

  const payload: Record<string, any> = {
    api_key: cleanKey,
    query,
    search_depth: searchDepth,
    include_answer: true,
    max_results: maxResults,
  };

  if (options?.includeDomains && options.includeDomains.length > 0) {
    payload.include_domains = options.includeDomains;
  }
  if (options?.excludeDomains && options.excludeDomains.length > 0) {
    payload.exclude_domains = options.excludeDomains;
  }

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Tavily search API error (${res.status}): ${errorText || res.statusText}`);
  }

  const data = await res.json();
  const rawResults = Array.isArray(data.results) ? data.results : [];

  const domainsSet = new Set<string>();
  const results: WebSearchResult[] = rawResults.map((item: any, idx: number) => {
    const domain = extractDomain(item.url || "");
    domainsSet.add(domain);
    return {
      id: `tavily-${idx}-${domain}`,
      url: item.url || "",
      title: item.title || domain,
      snippet: item.content || item.snippet || item.raw_content || "",
      domain,
      favicon: getFaviconUrl(domain),
      score: item.score,
      publishedDate: item.published_date,
      provider: "tavily" as const,
    };
  });

  return {
    query,
    domains: Array.from(domainsSet),
    resultsCount: results.length,
    results,
    answer: data.answer || undefined,
    provider: "tavily",
  };
}

/**
 * Tavily AI URL Content Extraction Implementation
 * POST https://api.tavily.com/extract
 */
export async function extractWithTavily(
  url: string,
  apiKey: string
): Promise<{ rawContent: string; title?: string }> {
  const cleanKey = apiKey.trim().replace(/^Bearer\s+/i, "");
  const res = await fetch("https://api.tavily.com/extract", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: cleanKey,
      urls: [url],
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Tavily extract API error (${res.status}): ${errorText || res.statusText}`);
  }

  const data = await res.json();
  const first = Array.isArray(data.results) ? data.results[0] : null;
  return {
    rawContent: first?.raw_content || first?.content || "",
    title: first?.title,
  };
}

/**
 * Firecrawl Search Implementation
 * POST https://api.firecrawl.dev/v1/search
 */
export async function searchWithFirecrawl(
  query: string,
  apiKey: string,
  options?: WebSearchOptions
): Promise<WebSearchResponse> {
  const cleanKey = apiKey.trim().replace(/^Bearer\s+/i, "");
  const limit = options?.maxResults ?? 10;

  const res = await fetch("https://api.firecrawl.dev/v1/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cleanKey}`,
    },
    body: JSON.stringify({
      query,
      limit,
      scrapeOptions: {
        formats: ["markdown"],
      },
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Firecrawl search API error (${res.status}): ${errorText || res.statusText}`);
  }

  const data = await res.json();
  const rawData = Array.isArray(data.data) ? data.data : (Array.isArray(data.results) ? data.results : []);

  const domainsSet = new Set<string>();
  const results: WebSearchResult[] = rawData.map((item: any, idx: number) => {
    const url = item.url || item.sourceURL || "";
    const domain = extractDomain(url);
    domainsSet.add(domain);
    return {
      id: `firecrawl-${idx}-${domain}`,
      url,
      title: item.title || item.metadata?.title || domain,
      snippet: item.description || item.metadata?.description || item.markdown?.slice(0, 300) || "",
      domain,
      favicon: getFaviconUrl(domain),
      provider: "firecrawl" as const,
    };
  });

  return {
    query,
    domains: Array.from(domainsSet),
    resultsCount: results.length,
    results,
    provider: "firecrawl",
  };
}

/**
 * Firecrawl Scrape Page Implementation
 * POST https://api.firecrawl.dev/v1/scrape
 */
export async function scrapeWithFirecrawl(
  url: string,
  apiKey: string
): Promise<{ markdown: string; title?: string; description?: string }> {
  const cleanKey = apiKey.trim().replace(/^Bearer\s+/i, "");
  const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cleanKey}`,
    },
    body: JSON.stringify({
      url,
      formats: ["markdown", "html"],
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Firecrawl scrape API error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  const markdown = data.data?.markdown || data.data?.content || data.markdown || "";
  const title = data.data?.metadata?.title || data.metadata?.title;
  const description = data.data?.metadata?.description || data.metadata?.description;
  return {
    markdown,
    title,
    description,
  };
}

/**
 * Intelligent Unified Search:
 * Prioritizes Tavily for fast structured results, falls back to Firecrawl,
 * or gracefully generates targeted simulated search results if no keys are yet configured.
 */
export async function performWebSearch(
  query: string,
  options?: WebSearchOptions
): Promise<WebSearchResponse> {
  const cleanQuery = query.trim();
  if (!cleanQuery) {
    return {
      query: "",
      domains: [],
      resultsCount: 0,
      results: [],
      provider: "simulated",
    };
  }

  // 1. Try Tavily (from client dashboard options or process.env)
  const tavilyKey = options?.apiKeyTavily?.trim() || process.env.TAVILY_API_KEY?.trim();
  if (tavilyKey) {
    try {
      return await searchWithTavily(cleanQuery, tavilyKey, options);
    } catch (err: any) {
      console.warn("Tavily search attempt failed, checking Firecrawl fallback:", err?.message || err);
    }
  }

  // 2. Try Firecrawl (from client dashboard options or process.env)
  const firecrawlKey = options?.apiKeyFirecrawl?.trim() || process.env.FIRECRAWL_API_KEY?.trim();
  if (firecrawlKey) {
    try {
      return await searchWithFirecrawl(cleanQuery, firecrawlKey, options);
    } catch (err: any) {
      console.warn("Firecrawl search attempt failed:", err?.message || err);
    }
  }

  // 3. Fallback: no API keys configured — return empty result with explanation
  // (Do NOT return hardcoded profile data — that would show developer info to all users)
  const detectedDomains: string[] = [];
  const lower = cleanQuery.toLowerCase();
  if (lower.includes("github")) detectedDomains.push("github.com");
  if (lower.includes("hugging face") || lower.includes("huggingface")) detectedDomains.push("huggingface.co");
  if (lower.includes("linkedin")) detectedDomains.push("linkedin.com");
  if (lower.includes("twitter") || lower.includes("x.com")) detectedDomains.push("x.com");
  if (lower.includes("google")) detectedDomains.push("google.com");
  if (detectedDomains.length === 0) {
    detectedDomains.push("web");
  }

  // Return empty results with a clear note — the UI should prompt user to add API keys
  return {
    query: cleanQuery,
    domains: detectedDomains,
    resultsCount: 0,
    results: [],
    answer: "Web search is not configured. Please add a Tavily or Firecrawl API key in Settings → API Keys to enable live web search.",
    provider: "simulated",
  };
}
