/**
 * Browserbase Cloud Browser Client
 * Provides managed cloud Chrome browsers with live view streaming, anti-bot bypass,
 * session replay, and Stagehand automation.
 * Documentation: https://docs.browserbase.com
 */

export interface BrowserbaseSessionOptions {
  apiKey?: string;
  startUrl?: string;
  keepAlive?: boolean;
  proxies?: boolean;
  timeoutSeconds?: number;
}

export interface BrowserbaseSession {
  sessionId: string;
  status: string;
  browserLiveViewUrl: string;
  connectUrl?: string;
  debuggerUrl?: string;
  createdAt: string;
}

const BROWSERBASE_BASE_URL = process.env.BROWSERBASE_BASE_URL || "https://api.browserbase.com/v1";

function resolveApiKey(explicitKey?: string): string {
  const key = explicitKey || process.env.BROWSERBASE_API_KEY || "";
  return key.trim();
}

/**
 * Creates a new sandboxed Chromium cloud browser on Browserbase.
 * Note: Browserbase auto-resolves the project from the API key (no projectId needed).
 */
export async function createBrowserbaseSession(
  options: BrowserbaseSessionOptions = {}
): Promise<BrowserbaseSession> {
  const apiKey = resolveApiKey(options.apiKey);
  if (!apiKey) {
    throw new Error(
      "Browserbase API key is missing. Please configure your Browserbase API key in Profile > API Keys or set BROWSERBASE_API_KEY."
    );
  }

  const payload: Record<string, unknown> = {
    keepAlive: Boolean(options.keepAlive),
    proxies: Boolean(options.proxies),
  };

  const response = await fetch(`${BROWSERBASE_BASE_URL}/sessions`, {
    method: "POST",
    headers: {
      "X-BB-API-Key": apiKey,
      "Content-Type": "application/json",
      "User-Agent": "CareerAgent-BrowserbaseClient/1.0",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let parsedMessage = errorText;
    try {
      const errJson = JSON.parse(errorText);
      parsedMessage = errJson.message || errJson.error || errorText;
    } catch {}
    throw new Error(`Browserbase session creation failed (${response.status}): ${parsedMessage}`);
  }

  const data = await response.json();
  const sessionId = data.id || data.sessionId;
  if (!sessionId) {
    throw new Error("Browserbase did not return a session id for the created browser.");
  }

  // The live view URL can be embedded or viewed in browser
  const liveViewUrl =
    data.liveUrls?.debuggerUrl ||
    data.debuggerUrl ||
    `https://www.browserbase.com/sessions/${sessionId}`;

  return {
    sessionId,
    status: data.status || "RUNNING",
    browserLiveViewUrl: liveViewUrl,
    connectUrl: data.connectUrl,
    debuggerUrl: data.liveUrls?.debuggerUrl,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Terminates / releases an active Browserbase browser session.
 */
export async function deleteBrowserbaseSession(
  sessionId: string,
  apiKey?: string
): Promise<{ success: boolean }> {
  const resolvedKey = resolveApiKey(apiKey);
  if (!resolvedKey) {
    throw new Error("Browserbase API key is required to delete a session.");
  }

  if (!sessionId) {
    return { success: true };
  }

  try {
    // Browserbase supports status update to REQUEST_RELEASE or DELETE
    const response = await fetch(`${BROWSERBASE_BASE_URL}/sessions/${encodeURIComponent(sessionId)}`, {
      method: "POST",
      headers: {
        "X-BB-API-Key": resolvedKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "REQUEST_RELEASE" }),
    });

    if (response.ok || response.status === 404) {
      return { success: true };
    }

    // Fallback to DELETE
    const deleteRes = await fetch(`${BROWSERBASE_BASE_URL}/sessions/${encodeURIComponent(sessionId)}`, {
      method: "DELETE",
      headers: {
        "X-BB-API-Key": resolvedKey,
      },
    });

    return { success: deleteRes.ok || deleteRes.status === 404 };
  } catch (err) {
    console.warn(`[browserbase-client] Failed to release session ${sessionId}:`, err);
    return { success: false };
  }
}

/**
 * Lightweight fetch page content using Browserbase Fetch API without spinning up a browser.
 */
export async function fetchBrowserbasePage(
  url: string,
  apiKey?: string
): Promise<{ success: boolean; content?: string; error?: string }> {
  const resolvedKey = resolveApiKey(apiKey);
  if (!resolvedKey) {
    throw new Error("Browserbase API key is required to use Fetch API.");
  }

  try {
    const response = await fetch(`${BROWSERBASE_BASE_URL}/fetch`, {
      method: "POST",
      headers: {
        "X-BB-API-Key": resolvedKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      const err = await response.text();
      return { success: false, error: err };
    }

    const data = await response.json();
    return { success: true, content: data.content || data.markdown || data.html };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to fetch page content" };
  }
}
