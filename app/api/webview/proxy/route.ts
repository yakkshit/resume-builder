import { NextRequest, NextResponse } from "next/server";

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  displayUrl?: string;
}

async function fetchLiveSearchResults(query: string): Promise<SearchResult[]> {
  const cleanQ = query.trim();
  if (!cleanQ) return [];

  const results: SearchResult[] = [];

  // 1. Try DuckDuckGo HTML Live Search
  try {
    const res = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(cleanQ)}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (res.ok) {
      const html = await res.text();
      // Match result snippets using regex
      const resultRegex = /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;
      let match;
      while ((match = resultRegex.exec(html)) !== null && results.length < 10) {
        let rawUrl = match[1];
        if (rawUrl.includes("uddg=")) {
          const params = new URLSearchParams(rawUrl.split("?")[1] || "");
          rawUrl = params.get("uddg") || rawUrl;
        } else if (rawUrl.startsWith("//")) {
          rawUrl = `https:${rawUrl}`;
        }

        const title = match[2].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim();
        const snippet = match[3].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim();

        if (title && rawUrl && (rawUrl.startsWith("http://") || rawUrl.startsWith("https://"))) {
          results.push({
            title,
            url: rawUrl,
            snippet,
            displayUrl: new URL(rawUrl).hostname,
          });
        }
      }
    }
  } catch {}

  // 2. Try Wikipedia OpenSearch API for rich contextual articles
  if (results.length < 4) {
    try {
      const wikiRes = await fetch(
        `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(cleanQ)}&limit=3&namespace=0&format=json`,
        { headers: { "User-Agent": "Mozilla/5.0 Chrome/124.0" } }
      );
      if (wikiRes.ok) {
        const data = await wikiRes.json();
        const titles = data[1] || [];
        const descriptions = data[2] || [];
        const urls = data[3] || [];
        for (let i = 0; i < titles.length; i++) {
          if (titles[i] && urls[i]) {
            results.push({
              title: `${titles[i]} - Wikipedia`,
              url: urls[i],
              snippet: descriptions[i] || `Read comprehensive reference and details about ${titles[i]} on Wikipedia.`,
              displayUrl: "wikipedia.org",
            });
          }
        }
      }
    } catch {}
  }

  // 3. Try DuckDuckGo Instant Answer API
  if (results.length < 3) {
    try {
      const apiRes = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(cleanQ)}&format=json`, {
        headers: { "User-Agent": "Mozilla/5.0 Chrome/124.0" },
      });
      if (apiRes.ok) {
        const data = await apiRes.json();
        if (data.AbstractText && data.AbstractURL) {
          results.push({
            title: data.Heading || cleanQ,
            url: data.AbstractURL,
            snippet: data.AbstractText,
            displayUrl: data.AbstractSource || new URL(data.AbstractURL).hostname,
          });
        }
        if (Array.isArray(data.RelatedTopics)) {
          for (const topic of data.RelatedTopics) {
            if (topic.Text && topic.FirstURL && results.length < 8) {
              results.push({
                title: topic.Text.split(" - ")[0] || topic.Text.slice(0, 60),
                url: topic.FirstURL,
                snippet: topic.Text,
                displayUrl: new URL(topic.FirstURL).hostname,
              });
            }
          }
        }
      }
    } catch {}
  }

  // 4. Clean dynamic fallback for specific query keywords (e.g. cedzlabs, cedzlasbalso)
  if (results.length === 0) {
    const querySlug = cleanQ.toLowerCase().replace(/[^a-z0-9]/g, "");
    results.push(
      {
        title: `${cleanQ} - Official Website & Solutions`,
        url: `https://${querySlug}.com`,
        snippet: `Explore official platforms, products, documentation, and technology services for ${cleanQ}.`,
        displayUrl: `${querySlug}.com`,
      },
      {
        title: `${cleanQ} on GitHub - Repositories & Open Source`,
        url: `https://github.com/search?q=${encodeURIComponent(cleanQ)}`,
        snippet: `Find open source software, repositories, libraries, and developer tools related to ${cleanQ} on GitHub.`,
        displayUrl: "github.com",
      },
      {
        title: `${cleanQ} on Wikipedia - Free Encyclopedia`,
        url: `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(cleanQ)}`,
        snippet: `Read encyclopedia articles, background, history, and references regarding ${cleanQ}.`,
        displayUrl: "wikipedia.org",
      },
      {
        title: `${cleanQ} - Latest Discussions on Hacker News`,
        url: `https://hn.algolia.com/?q=${encodeURIComponent(cleanQ)}`,
        snippet: `Discover tech news, articles, and community discussions about ${cleanQ}.`,
        displayUrl: "news.ycombinator.com",
      }
    );
  }

  return results;
}

function renderGoogleHomepageHtml(): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Google - Chrome Chromium</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          background-color: #0f0f12;
          color: #f1f1f5;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }
        .container {
          width: 100%;
          max-width: 640px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
        }
        .google-logo {
          font-size: 56px;
          font-weight: 800;
          letter-spacing: -1.5px;
          user-select: none;
        }
        .g-blue { color: #4285F4; }
        .g-red { color: #EA4335; }
        .g-yellow { color: #FBBC05; }
        .g-green { color: #34A853; }
        .search-form {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
        .search-input-wrapper {
          position: relative;
          width: 100%;
        }
        .search-input {
          width: 100%;
          background: #18181b;
          border: 1px solid #3f3f46;
          border-radius: 28px;
          padding: 14px 22px 14px 44px;
          color: #ffffff;
          font-size: 15px;
          transition: all 0.2s;
          box-shadow: 0 4px 16px rgba(0,0,0,0.3);
        }
        .search-input:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
        }
        .search-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #a1a1aa;
          font-size: 16px;
        }
        .button-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .btn {
          background: #27272a;
          color: #f4f4f5;
          border: 1px solid #3f3f46;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s;
          text-decoration: none;
        }
        .btn:hover { background: #3f3f46; border-color: #6366f1; color: white; }
        .btn.primary { background: #6366f1; border-color: #6366f1; color: white; }
        .btn.primary:hover { background: #4f46e5; }
        .shortcuts-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          width: 100%;
          margin-top: 12px;
        }
        .shortcut-card {
          background: #18181b;
          border: 1px solid #27272a;
          border-radius: 12px;
          padding: 14px 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          color: #e4e4e7;
          transition: all 0.2s;
        }
        .shortcut-card:hover {
          border-color: #6366f1;
          background: #27272a;
          transform: translateY(-2px);
          color: white;
        }
        .shortcut-icon {
          font-size: 22px;
        }
        .shortcut-title {
          font-size: 12px;
          font-weight: 500;
          text-align: center;
        }
        .footer-note {
          font-size: 12px;
          color: #71717a;
          margin-top: 20px;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="google-logo">
          <span class="g-blue">G</span><span class="g-red">o</span><span class="g-yellow">o</span><span class="g-blue">g</span><span class="g-green">l</span><span class="g-red">e</span>
        </div>

        <form class="search-form" method="GET" action="/api/webview/proxy">
          <div class="search-input-wrapper">
            <span class="search-icon">🔍</span>
            <input type="text" name="url" class="search-input" autofocus placeholder="Search Google or enter any website URL (e.g. cedzlabs, github, wikipedia)...">
          </div>
          <div class="button-row">
            <button type="submit" class="btn primary">Google Search</button>
            <a href="/api/webview/proxy?url=https://github.com/trending" class="btn">I'm Feeling Lucky</a>
          </div>
        </form>

        <div class="shortcuts-grid">
          <a href="/api/webview/proxy?url=https://cedzlabs.com" class="shortcut-card">
            <span class="shortcut-icon">🚀</span>
            <span class="shortcut-title">Cedzlabs</span>
          </a>
          <a href="/api/webview/proxy?url=https://github.com" class="shortcut-card">
            <span class="shortcut-icon">💻</span>
            <span class="shortcut-title">GitHub</span>
          </a>
          <a href="/api/webview/proxy?url=https://wikipedia.org" class="shortcut-card">
            <span class="shortcut-icon">📚</span>
            <span class="shortcut-title">Wikipedia</span>
          </a>
          <a href="/api/webview/proxy?url=https://news.ycombinator.com" class="shortcut-card">
            <span class="shortcut-icon">📰</span>
            <span class="shortcut-title">Hacker News</span>
          </a>
          <a href="/api/webview/proxy?url=https://linkedin.com" class="shortcut-card">
            <span class="shortcut-icon">💼</span>
            <span class="shortcut-title">LinkedIn</span>
          </a>
          <a href="/api/webview/proxy?url=https://developer.mozilla.org" class="shortcut-card">
            <span class="shortcut-icon">📖</span>
            <span class="shortcut-title">MDN Docs</span>
          </a>
          <a href="/api/webview/proxy?url=https://stackoverflow.com" class="shortcut-card">
            <span class="shortcut-icon">💡</span>
            <span class="shortcut-title">StackOverflow</span>
          </a>
          <a href="/api/webview/proxy?url=https://youtube.com" class="shortcut-card">
            <span class="shortcut-icon">▶️</span>
            <span class="shortcut-title">YouTube</span>
          </a>
        </div>

        <div class="footer-note">
          Chromium Webview with AI Element Inspector &amp; Human-in-the-Loop Agent Control
        </div>
      </div>
    </body>
    </html>
  `;
}

async function renderSearchEngineHtml(query: string): Promise<string> {
  const cleanQ = query.trim();
  if (!cleanQ || cleanQ === "google.com" || cleanQ === "google" || cleanQ === "chrome://newtab" || cleanQ === "about:blank") {
    return renderGoogleHomepageHtml();
  }

  const searchResults = await fetchLiveSearchResults(cleanQ);

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${cleanQ} - Google &amp; Web Search</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          background-color: #0f0f12;
          color: #f1f1f5;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          padding: 16px 20px;
          line-height: 1.5;
        }
        .header {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding-bottom: 16px;
          margin-bottom: 18px;
          border-bottom: 1px solid #27272a;
        }
        .logo-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .google-logo {
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.5px;
          text-decoration: none;
        }
        .g-blue { color: #4285F4; }
        .g-red { color: #EA4335; }
        .g-yellow { color: #FBBC05; }
        .g-green { color: #34A853; }
        .search-box {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          max-width: 680px;
        }
        input[type="text"] {
          flex: 1;
          background: #18181b;
          border: 1px solid #3f3f46;
          border-radius: 24px;
          padding: 10px 18px;
          color: #ffffff;
          font-size: 14px;
        }
        input[type="text"]:focus { outline: none; border-color: #6366f1; }
        button.search-btn {
          background: #6366f1;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 24px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        button.search-btn:hover { background: #4f46e5; }
        .filter-pills {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow-x: auto;
          padding-top: 4px;
        }
        .pill {
          font-size: 11px;
          font-weight: 500;
          background: #18181b;
          border: 1px solid #27272a;
          color: #a1a1aa;
          padding: 5px 14px;
          border-radius: 16px;
          text-decoration: none;
          white-space: nowrap;
          cursor: pointer;
        }
        .pill.active, .pill:hover {
          background: #27272a;
          color: #ffffff;
          border-color: #6366f1;
        }
        .results-count { font-size: 12px; color: #a1a1aa; margin-bottom: 16px; }
        .card-list { display: flex; flex-direction: column; gap: 18px; max-width: 760px; }
        .card {
          background: #18181b;
          border: 1px solid #27272a;
          border-radius: 12px;
          padding: 16px;
          transition: border-color 0.2s, transform 0.2s;
        }
        .card:hover {
          border-color: #6366f1;
          transform: translateY(-1px);
        }
        .card-host {
          font-size: 11px;
          color: #a1a1aa;
          margin-bottom: 4px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .card-title {
          font-size: 17px;
          font-weight: 600;
          color: #818cf8;
          text-decoration: none;
          display: inline-block;
          margin-bottom: 6px;
          line-height: 1.3;
        }
        .card-title:hover { text-decoration: underline; color: #a5b4fc; }
        .card-snippet {
          font-size: 13px;
          color: #d4d4d8;
          margin-bottom: 12px;
          line-height: 1.45;
        }
        .actions {
          display: flex;
          align-items: center;
          gap: 8px;
          border-top: 1px solid #27272a;
          padding-top: 10px;
        }
        .btn-action {
          background: #27272a;
          color: #f4f4f5;
          border: 1px solid #3f3f46;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
          text-decoration: none;
        }
        .btn-action:hover { background: #6366f1; color: white; border-color: #6366f1; }
        .btn-action.primary { background: #6366f1; color: white; border-color: #6366f1; }
        .btn-action.primary:hover { background: #4f46e5; }
      </style>
      <script>
        function askAgentAboutPage(title, url, snippet) {
          window.parent.postMessage({
            type: 'ASK_AI_ABOUT_URL',
            url: url,
            text: 'I found this website from search: "' + title + '" (' + url + ').\\nSummary: "' + snippet + '"\\n\\nPlease analyze this platform, summarize what it offers, and explain how it is relevant.'
          }, '*');
        }
        function generateComponentForPage(title, url) {
          window.parent.postMessage({
            type: 'ASK_AI_ABOUT_URL',
            url: url,
            text: 'Analyze the UI and brand of ' + title + ' (' + url + ') and generate a modern, responsive React component with Tailwind CSS.'
          }, '*');
        }
      </script>
    </head>
    <body>
      <div class="header">
        <div class="logo-row">
          <a href="/api/webview/proxy?url=https://www.google.com" class="google-logo">
            <span class="g-blue">G</span><span class="g-red">o</span><span class="g-yellow">o</span><span class="g-blue">g</span><span class="g-green">l</span><span class="g-red">e</span>
          </a>
          <span style="font-size: 12px; color: #a1a1aa; font-weight: 500;">&amp; Live Web Search</span>
        </div>
        <form class="search-box" method="GET" action="/api/webview/proxy">
          <input type="text" name="url" value="${cleanQ}" placeholder="Search anything on the web or enter URL (e.g. cedzlabs, github, wikipedia)...">
          <button type="submit" class="search-btn">Search</button>
        </form>
        <div class="filter-pills">
          <a class="pill active" href="/api/webview/proxy?url=${encodeURIComponent(cleanQ)}">All Results</a>
          <a class="pill" href="/api/webview/proxy?url=${encodeURIComponent(cleanQ + ' official website')}">🌐 Website</a>
          <a class="pill" href="/api/webview/proxy?url=${encodeURIComponent(cleanQ + ' github code')}">💻 Code &amp; Repos</a>
          <a class="pill" href="/api/webview/proxy?url=${encodeURIComponent(cleanQ + ' wikipedia')}">📚 Wiki</a>
          <a class="pill" href="/api/webview/proxy?url=${encodeURIComponent(cleanQ + ' news')}">📰 News</a>
        </div>
      </div>

      <div class="results-count">Showing live web search results for "<strong>${cleanQ}</strong>"</div>

      <div class="card-list">
        ${searchResults
          .map(
            (r) => `
          <div class="card">
            <div class="card-host">🌐 ${r.displayUrl || "web"}</div>
            <a class="card-title" href="/api/webview/proxy?url=${encodeURIComponent(r.url)}">${r.title}</a>
            <p class="card-snippet">${r.snippet}</p>
            <div class="actions">
              <a class="btn-action primary" href="/api/webview/proxy?url=${encodeURIComponent(r.url)}">
                🚀 Open in Browser
              </a>
              <button class="btn-action" onclick="askAgentAboutPage('${r.title.replace(/'/g, "\\'")}', '${r.url.replace(/'/g, "\\'")}', '${r.snippet.replace(/'/g, "\\'")}')">
                🤖 Ask AI to Analyze
              </button>
              <button class="btn-action" onclick="generateComponentForPage('${r.title.replace(/'/g, "\\'")}', '${r.url.replace(/'/g, "\\'")}')">
                ⚛️ Generate React UI
              </button>
              <a class="btn-action" href="${r.url}" target="_blank" rel="noopener noreferrer">
                ↗️ New Tab
              </a>
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    </body>
    </html>
  `;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get("url") || searchParams.get("q");

  if (!targetUrl || targetUrl === "google.com" || targetUrl === "https://www.google.com" || targetUrl === "http://www.google.com" || targetUrl === "chrome://newtab" || targetUrl === "about:blank") {
    const html = renderGoogleHomepageHtml();
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "X-Frame-Options": "ALLOWALL",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  const trimmed = targetUrl.trim();

  // If input is a search query or contains career-search.local, render live search results
  if (
    trimmed.includes("career-search.local") ||
    trimmed.includes("web-search.local") ||
    trimmed.includes("google.com/search") ||
    trimmed.includes("duckduckgo.com") ||
    trimmed.includes("bing.com") ||
    trimmed.includes("yahoo.com") ||
    (!trimmed.startsWith("http://") && !trimmed.startsWith("https://") && (!trimmed.includes(".") || trimmed.includes(" ")))
  ) {
    let query = trimmed;
    try {
      if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        const u = new URL(trimmed);
        query = u.searchParams.get("q") || u.searchParams.get("query") || u.hostname.replace(/^www\./, "");
        if (query === "google.com" || query === "google") query = "";
      } else if (trimmed.includes("?q=")) {
        query = new URL(`https://${trimmed}`).searchParams.get("q") || trimmed;
      }
    } catch {}

    const html = await renderSearchEngineHtml(query);
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "X-Frame-Options": "ALLOWALL",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  let validUrl: URL;
  try {
    const formatted = trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : `https://${trimmed}`;
    validUrl = new URL(formatted);
  } catch {
    const html = await renderSearchEngineHtml(trimmed);
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "X-Frame-Options": "ALLOWALL",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  try {
    const response = await fetch(validUrl.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Upgrade-Insecure-Requests": "1",
      },
      redirect: "follow",
    });

    const contentType = response.headers.get("content-type") || "text/html";
    if (contentType.includes("application/json")) {
      const data = await response.json();
      return NextResponse.json(data);
    }

    let html = await response.text();
    const finalUrl = response.url || validUrl.toString();
    const origin = new URL(finalUrl).origin;
    const basePath = new URL(finalUrl).pathname;

    // Strip restrictive CSP and X-Frame-Options meta tags from HTML
    html = html.replace(/<meta[^>]*http-equiv=["']?(?:content-security-policy|x-frame-options|frame-options)["']?[^>]*>/gi, "");
    html = html.replace(/<meta[^>]*name=["']?(?:content-security-policy|x-frame-options)["']?[^>]*>/gi, "");

    // Strip integrity and nonce attributes which cause browsers to block proxied/CDN stylesheets and scripts
    html = html.replace(/\s+integrity=["'][^"']*["']/gi, "");
    html = html.replace(/\s+nonce=["'][^"']*["']/gi, "");

    // Convert protocol-relative URLs (//cdn...) to HTTPS (https://cdn...) so dev server on HTTP doesn't fail
    html = html.replace(/(href|src|action)=["']\/\/([^"']+)["']/gi, '$1="https://$2"');
    html = html.replace(/(url\(\s*["']?)\/\/([^"')]+)(["']?\s*\))/gi, '$1https://$2$3');

    // Strip existing <base> tags
    html = html.replace(/<base\b[^>]*>/gi, "");

    // Rewrite stylesheet <link> tags to absolute URLs
    html = html.replace(
      /(<link\s+[^>]*?href=["'])(?!https?:\/\/|data:)([^"']+)(["'])/gi,
      (match, p1, p2, p3) => {
        try {
          const resolved = new URL(p2, origin).toString();
          return `${p1}${resolved}${p3}`;
        } catch {
          return match;
        }
      }
    );

    // Rewrite <script src="..."> to absolute URLs
    html = html.replace(
      /(<script\s+[^>]*?src=["'])(?!https?:\/\/|data:)([^"']+)(["'])/gi,
      (match, p1, p2, p3) => {
        try {
          const resolved = new URL(p2, origin).toString();
          return `${p1}${resolved}${p3}`;
        } catch {
          return match;
        }
      }
    );

    // Rewrite <img src="..."> and <img srcset="..."> to absolute URLs
    html = html.replace(
      /(<img\s+[^>]*?src=["'])(?!https?:\/\/|data:)([^"']+)(["'])/gi,
      (match, p1, p2, p3) => {
        try {
          const resolved = new URL(p2, origin).toString();
          return `${p1}${resolved}${p3}`;
        } catch {
          return match;
        }
      }
    );

    // Rewrite relative <a> links to absolute URLs
    html = html.replace(
      /(<a\s+(?:[^>]*?\s+)?href=["'])(?!https?:\/\/|javascript:|mailto:|tel:|#)([^"']+)(["'])/gi,
      (match, p1, p2, p3) => {
        try {
          const resolved = new URL(p2, origin).toString();
          return `${p1}${resolved}${p3}`;
        } catch {
          return match;
        }
      }
    );

    // Rewrite <form action="..."> to absolute URLs
    html = html.replace(
      /(<form\s+[^>]*?action=["'])(?!https?:\/\/|javascript:)([^"']+)(["'])/gi,
      (match, p1, p2, p3) => {
        try {
          const resolved = new URL(p2, origin).toString();
          return `${p1}${resolved}${p3}`;
        } catch {
          return match;
        }
      }
    );

    // Neutralize frame-busting scripts
    html = html.replace(/if\s*\(\s*(?:top|window\.top)\s*!==?\s*(?:self|window\.self)\s*\)/gi, "if (false)");
    html = html.replace(/top\.location\s*=/gi, "window.location =");

    // Client-side injection script for interactive navigation, text selection, element inspect, and agent cursor
    const injectedScript = `
      <base href="${origin}/" target="_self">
      <style id="career-webview-helper">
        /* Target highlight when agent points to element */
        .agent-highlight-target {
          outline: 3px solid #6366f1 !important;
          box-shadow: 0 0 15px rgba(99, 102, 241, 0.6) !important;
          transition: all 0.3s ease !important;
          border-radius: 4px !important;
        }
        /* Inspector Hover mode style */
        .agent-inspect-hover {
          outline: 2px dashed #a855f7 !important;
          background: rgba(168, 85, 247, 0.12) !important;
          cursor: crosshair !important;
        }
      </style>
      <script>
        (function() {
          var isInspectorActive = false;

          try {
            window.parent.postMessage({
              type: 'WEBVIEW_PAGE_LOADED',
              url: window.location.href,
              title: document.title,
            }, '*');
          } catch(e) {}

          // Text selection forwarding to parent window
          document.addEventListener('mouseup', function(e) {
            if (isInspectorActive) return;
            var selection = window.getSelection();
            if (selection && selection.toString().trim().length > 0) {
              var text = selection.toString().trim();
              var rect = selection.getRangeAt(0).getBoundingClientRect();
              window.parent.postMessage({
                type: 'WEBVIEW_TEXT_SELECTED',
                text: text,
                clientX: e.clientX,
                clientY: e.clientY,
                rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height }
              }, '*');
            }
          });

          // Element Inspector Hover & Click capture
          document.addEventListener('mouseover', function(e) {
            if (!isInspectorActive) return;
            document.querySelectorAll('.agent-inspect-hover').forEach(function(el) {
              el.classList.remove('agent-inspect-hover');
            });
            var target = e.target;
            if (target && target !== document.body) {
              target.classList.add('agent-inspect-hover');
            }
          }, true);

          document.addEventListener('click', function(e) {
            if (isInspectorActive) {
              e.preventDefault();
              e.stopPropagation();
              var target = e.target;
              if (target) {
                target.classList.remove('agent-inspect-hover');
                var html = target.outerHTML ? target.outerHTML.slice(0, 3000) : '';
                var text = target.innerText ? target.innerText.slice(0, 1500) : '';
                var tag = target.tagName ? target.tagName.toLowerCase() : 'element';
                window.parent.postMessage({
                  type: 'WEBVIEW_ELEMENT_INSPECTED',
                  tag: tag,
                  text: text,
                  html: html,
                  clientX: e.clientX,
                  clientY: e.clientY
                }, '*');
              }
              return false;
            }

            // Intercept link clicks to route seamlessly through webview proxy
            var anchor = e.target.closest('a');
            if (anchor && anchor.href) {
              var href = anchor.href;
              if (!href.startsWith('javascript:') && !href.startsWith('mailto:') && !href.startsWith('tel:') && href !== '#' && !href.startsWith(window.location.href + '#')) {
                e.preventDefault();
                e.stopPropagation();
                window.parent.postMessage({
                  type: 'WEBVIEW_NAVIGATE_REQUEST',
                  url: href
                }, '*');
                return false;
              }
            }

            // Detect Form interactions
            var form = e.target.closest('form');
            if (form && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT')) {
              var fieldName = e.target.getAttribute('name') || e.target.getAttribute('placeholder') || e.target.id || 'Form Field';
              window.parent.postMessage({
                type: 'WEBVIEW_FORM_FIELD_SELECTED',
                fieldName: fieldName,
                formAction: form.action || window.location.href,
                formHtml: form.outerHTML.slice(0, 2000)
              }, '*');
            }
          }, true);

          // Intercept Form submissions
          document.addEventListener('submit', function(e) {
            var form = e.target;
            if (form && form.action) {
              var method = (form.method || 'GET').toUpperCase();
              if (method === 'GET') {
                e.preventDefault();
                e.stopPropagation();
                var actionUrl = form.action;
                try {
                  var formData = new FormData(form);
                  var params = new URLSearchParams();
                  for (var pair of formData.entries()) {
                    if (typeof pair[1] === 'string') {
                      params.append(pair[0], pair[1]);
                    }
                  }
                  var fullUrl = actionUrl + (actionUrl.includes('?') ? '&' : '?') + params.toString();
                  window.parent.postMessage({
                    type: 'WEBVIEW_NAVIGATE_REQUEST',
                    url: fullUrl
                  }, '*');
                  return false;
                } catch(err) {}
              }
            }
          }, true);

          // Handle automation commands from parent
          window.addEventListener('message', function(event) {
            if (!event.data) return;
            var data = event.data;

            if (data.type === 'SET_INSPECTOR_MODE') {
              isInspectorActive = Boolean(data.active);
              if (!isInspectorActive) {
                document.querySelectorAll('.agent-inspect-hover').forEach(function(el) {
                  el.classList.remove('agent-inspect-hover');
                });
              }
            } else if (data.type === 'AGENT_SCROLL') {
              window.scrollTo({
                top: data.top || 0,
                behavior: 'smooth'
              });
            } else if (data.type === 'AGENT_HIGHLIGHT') {
              document.querySelectorAll('.agent-highlight-target').forEach(function(el) {
                el.classList.remove('agent-highlight-target');
              });
              if (data.selector) {
                var el = document.querySelector(data.selector);
                if (el) {
                  el.classList.add('agent-highlight-target');
                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }
            } else if (data.type === 'AGENT_EXTRACT_TEXT') {
              var text = document.body ? document.body.innerText.slice(0, 4000) : '';
              window.parent.postMessage({
                type: 'AGENT_EXTRACTED_DATA',
                text: text,
                title: document.title,
                url: window.location.href
              }, '*');
            }
          });
        })();
      </script>
    `;

    if (html.includes("<head>")) {
      html = html.replace("<head>", `<head>${injectedScript}`);
    } else {
      html = `${injectedScript}${html}`;
    }

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "X-Frame-Options": "ALLOWALL",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (error) {
    const html = await renderSearchEngineHtml(validUrl.hostname);
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "X-Frame-Options": "ALLOWALL",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
}
