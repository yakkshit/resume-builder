/**
 * Steel.dev Cloud Browser Client
 * Provides managed cloud browsers with live interactive viewer, CDP websocket,
 * anti-bot stealth, long-lived sessions, and scraping.
 * Documentation: https://docs.steel.dev
 */

export interface SteelSessionOptions {
  apiKey?: string;
  startUrl?: string;
  sessionTimeoutMs?: number;
  dimensions?: {
    width: number;
    height: number;
  };
}

export interface SteelSession {
  sessionId: string;
  status: string;
  browserLiveViewUrl: string;
  websocketUrl?: string;
  debugUrl?: string;
  sessionViewerUrl?: string;
  createdAt: string;
}

const STEEL_BASE_URL = process.env.STEEL_BASE_URL || "https://api.steel.dev/v1";

function resolveApiKey(explicitKey?: string): string {
  const key = explicitKey || process.env.STEEL_API_KEY || "";
  return key.trim();
}

/**
 * Creates a new sandboxed cloud browser session on Steel.
 * Returns browserLiveViewUrl (debugUrl or sessionViewerUrl) for interactive embedding.
 */
export async function createSteelSession(options: SteelSessionOptions = {}): Promise<SteelSession> {
  const apiKey = resolveApiKey(options.apiKey);
  if (!apiKey) {
    throw new Error(
      "Steel API key is missing. Please configure your Steel API key in Profile > API Keys or set STEEL_API_KEY."
    );
  }

  const payload: Record<string, unknown> = {
    sessionTimeout: options.sessionTimeoutMs || 1800000, // 30 minutes
  };

  if (options.dimensions) {
    payload.dimensions = options.dimensions;
  }

  const response = await fetch(`${STEEL_BASE_URL}/sessions`, {
    method: "POST",
    headers: {
      "Steel-API-Key": apiKey,
      "Content-Type": "application/json",
      "User-Agent": "CareerAgent-SteelClient/1.0",
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
    throw new Error(`Steel session creation failed (${response.status}): ${parsedMessage}`);
  }

  const data = await response.json();
  const sessionId = data.id || data.sessionId;
  if (!sessionId) {
    throw new Error("Steel did not return a session id for the created browser.");
  }

  // Steel provides sessionViewerUrl or debugUrl for interactive live viewing
  const liveViewUrl =
    data.sessionViewerUrl ||
    data.debugUrl ||
    `https://app.steel.dev/sessions/${sessionId}`;

  return {
    sessionId,
    status: data.status || "live",
    browserLiveViewUrl: liveViewUrl,
    websocketUrl: data.websocketUrl,
    debugUrl: data.debugUrl,
    sessionViewerUrl: data.sessionViewerUrl,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Releases / terminates an active Steel browser session.
 */
export async function deleteSteelSession(
  sessionId: string,
  apiKey?: string
): Promise<{ success: boolean }> {
  const resolvedKey = resolveApiKey(apiKey);
  if (!resolvedKey) {
    throw new Error("Steel API key is required to release a session.");
  }

  if (!sessionId) {
    return { success: true };
  }

  try {
    // Try releasing first
    const releaseRes = await fetch(`${STEEL_BASE_URL}/sessions/${encodeURIComponent(sessionId)}/release`, {
      method: "POST",
      headers: {
        "Steel-API-Key": resolvedKey,
        "Content-Type": "application/json",
      },
    });

    if (releaseRes.ok || releaseRes.status === 404) {
      return { success: true };
    }

    // Fallback to DELETE
    const deleteRes = await fetch(`${STEEL_BASE_URL}/sessions/${encodeURIComponent(sessionId)}`, {
      method: "DELETE",
      headers: {
        "Steel-API-Key": resolvedKey,
      },
    });

    return { success: deleteRes.ok || deleteRes.status === 404 };
  } catch (err) {
    console.warn(`[steel-client] Failed to release session ${sessionId}:`, err);
    return { success: false };
  }
}

/**
 * Scrapes a web page using Steel's scraping endpoint.
 */
export async function scrapeWithSteel(
  url: string,
  apiKey?: string
): Promise<{ success: boolean; content?: string; error?: string }> {
  const resolvedKey = resolveApiKey(apiKey);
  if (!resolvedKey) {
    throw new Error("Steel API key is required for scraping.");
  }

  try {
    const response = await fetch(`${STEEL_BASE_URL}/scrape`, {
      method: "POST",
      headers: {
        "Steel-API-Key": resolvedKey,
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
    return { success: false, error: err.message || "Failed to scrape with Steel" };
  }
}
