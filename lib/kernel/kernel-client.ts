/**
 * Kernel.sh Cloud Browser Client
 * Provides fast cloud Chromium sandboxes (<30ms boot) with interactive Live View,
 * CDP websockets, and Playwright execution.
 * Documentation: https://kernel.sh/docs
 */

export interface KernelBrowserOptions {
  apiKey?: string;
  startUrl?: string;
  stealth?: boolean;
  headless?: boolean;
  timeoutSeconds?: number;
  viewport?: {
    width: number;
    height: number;
  };
}

export interface KernelBrowserSession {
  sessionId: string;
  browserLiveViewUrl: string;
  cdpWsUrl?: string;
  webdriverWsUrl?: string;
  baseUrl?: string;
  status: string;
  stealth: boolean;
  createdAt: string;
}

const KERNEL_BASE_URL = process.env.KERNEL_BASE_URL || "https://api.onkernel.com";

function resolveApiKey(explicitKey?: string): string {
  const key = explicitKey || process.env.KERNEL_API_KEY || "";
  return key.trim();
}

/**
 * Creates a new sandboxed Chromium cloud browser on Kernel.
 * Returns browser_live_view_url for interactive embedding.
 */
export async function createKernelBrowser(options: KernelBrowserOptions = {}): Promise<KernelBrowserSession> {
  const apiKey = resolveApiKey(options.apiKey);
  if (!apiKey) {
    throw new Error(
      "Kernel API key is missing. Please configure your Kernel API key in Profile > API Keys or set KERNEL_API_KEY."
    );
  }

  const payload: Record<string, unknown> = {
    start_url: options.startUrl || "https://www.google.com",
    stealth: Boolean(options.stealth),
    headless: Boolean(options.headless),
    timeout_seconds: options.timeoutSeconds || 1800, // 30 minutes default
  };

  if (options.viewport) {
    payload.viewport = options.viewport;
  }

  const response = await fetch(`${KERNEL_BASE_URL}/browsers`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "CareerAgent-KernelClient/1.0",
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
    throw new Error(`Kernel Browser creation failed (${response.status}): ${parsedMessage}`);
  }

  const data = await response.json();
  const sessionId = data.session_id || data.id;
  const browserLiveViewUrl = data.browser_live_view_url || data.live_view_url || "";

  if (!sessionId) {
    throw new Error("Kernel did not return a session_id for the created browser.");
  }

  return {
    sessionId,
    browserLiveViewUrl,
    cdpWsUrl: data.cdp_ws_url,
    webdriverWsUrl: data.webdriver_ws_url,
    baseUrl: data.base_url,
    status: data.status || "active",
    stealth: Boolean(options.stealth),
    createdAt: new Date().toISOString(),
  };
}

/**
 * Deletes / terminates a running Kernel cloud browser session.
 */
export async function deleteKernelBrowser(sessionId: string, apiKey?: string): Promise<{ success: boolean }> {
  const resolvedKey = resolveApiKey(apiKey);
  if (!resolvedKey) {
    throw new Error("Kernel API key is required to delete a session.");
  }

  if (!sessionId) {
    return { success: true };
  }

  try {
    const response = await fetch(`${KERNEL_BASE_URL}/browsers/${encodeURIComponent(sessionId)}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${resolvedKey}`,
      },
    });

    return { success: response.ok || response.status === 404 };
  } catch (err) {
    console.warn(`[kernel-client] Failed to delete session ${sessionId}:`, err);
    return { success: false };
  }
}

/**
 * Executes Playwright automation code directly inside a running Kernel browser VM.
 */
export async function executeKernelPlaywright(
  sessionId: string,
  code: string,
  apiKey?: string
): Promise<{ success: boolean; result?: unknown; error?: string }> {
  const resolvedKey = resolveApiKey(apiKey);
  if (!resolvedKey) {
    throw new Error("Kernel API key is required to execute Playwright code.");
  }

  try {
    const response = await fetch(`${KERNEL_BASE_URL}/browsers/${encodeURIComponent(sessionId)}/playwright/execute`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resolvedKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      const err = await response.text();
      return { success: false, error: err };
    }

    const data = await response.json();
    return { success: true, result: data.result ?? data };
  } catch (err: any) {
    return { success: false, error: err.message || "Playwright execution error" };
  }
}
