/**
 * Playwright Browser Session Manager
 * Maintains a singleton Chromium browser instance for screenshot-based browsing.
 * The browser runs headless on the server; the client renders screenshots and
 * forwards user interactions (click, type, scroll, navigate) as API calls.
 */

import type { Browser, BrowserContext, Page } from "playwright-core";

interface BrowserSession {
  id: string;
  page: Page;
  context: BrowserContext;
  createdAt: number;
  lastUsedAt: number;
}

// Singleton browser instance shared across sessions
let browser: Browser | null = null;
const sessions = new Map<string, BrowserSession>();

// Clean up idle sessions after 10 minutes
const SESSION_TTL_MS = 10 * 60 * 1000;

async function getBrowser(): Promise<Browser> {
  if (browser && browser.isConnected()) return browser;

  // Try to use system-installed Chromium via playwright-core
  const { chromium } = await import("playwright-core");

  if (process.env.VERCEL || process.env.NEXT_PUBLIC_VERCEL_ENV) {
    try {
      const sparticuz = (await import("@sparticuz/chromium")).default || await import("@sparticuz/chromium");
      browser = await chromium.launch({
        args: sparticuz.args,
        executablePath: await sparticuz.executablePath(),
        headless: true,
      });

      browser.on("disconnected", () => {
        browser = null;
        sessions.clear();
      });

      return browser;
    } catch (err) {
      console.warn("Failed to launch @sparticuz/chromium. Falling back...", err);
    }
  }

  // Find system Chrome/Chromium binary
  const possiblePaths = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/usr/bin/google-chrome",
  ];

  const { existsSync } = await import("fs");
  const systemChrome = possiblePaths.find((p) => existsSync(p));

  browser = await chromium.launch({
    headless: true,
    executablePath: systemChrome || undefined, // falls back to playwright-core's bundled chromium
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--disable-gpu",
      "--disable-web-security", // allow cross-origin
      "--disable-features=IsolateOrigins,site-per-process",
      "--window-size=1280,900",
    ],
  });

  browser.on("disconnected", () => {
    browser = null;
    sessions.clear();
  });

  return browser;
}

export async function createSession(): Promise<string> {
  const b = await getBrowser();

  const context = await b.newContext({
    viewport: { width: 1280, height: 900 },
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    locale: "en-US",
    timezoneId: "America/New_York",
    acceptDownloads: true,
  });

  const page = await context.newPage();

  const id = `session_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  sessions.set(id, {
    id,
    page,
    context,
    createdAt: Date.now(),
    lastUsedAt: Date.now(),
  });

  // Clean up idle sessions in the background
  setTimeout(() => cleanupIdleSessions(), SESSION_TTL_MS);

  return id;
}

export async function getSession(id: string): Promise<BrowserSession | null> {
  const session = sessions.get(id);
  if (!session) return null;
  session.lastUsedAt = Date.now();
  return session;
}

export async function destroySession(id: string): Promise<void> {
  const session = sessions.get(id);
  if (!session) return;
  try {
    await session.context.close();
  } catch {}
  sessions.delete(id);
}

function cleanupIdleSessions(): void {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (now - session.lastUsedAt > SESSION_TTL_MS) {
      destroySession(id).catch(() => {});
    }
  }
}

export async function takeScreenshot(sessionId: string): Promise<{
  imageBase64: string;
  url: string;
  title: string;
  canGoBack: boolean;
  canGoForward: boolean;
}> {
  const session = await getSession(sessionId);
  if (!session) throw new Error("Session not found");

  const page = session.page;
  const imageBuffer = await page.screenshot({ type: "jpeg", quality: 85, fullPage: false });

  return {
    imageBase64: imageBuffer.toString("base64"),
    url: page.url(),
    title: await page.title(),
    canGoBack: await page.evaluate(() => window.history.length > 1),
    canGoForward: false, // Playwright doesn't expose forward state directly
  };
}

export async function navigateSession(
  sessionId: string,
  url: string
): Promise<{ imageBase64: string; url: string; title: string }> {
  const session = await getSession(sessionId);
  if (!session) throw new Error("Session not found");

  const page = session.page;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.waitForTimeout(800); // let JS settle

  const imageBuffer = await page.screenshot({ type: "jpeg", quality: 85 });
  return {
    imageBase64: imageBuffer.toString("base64"),
    url: page.url(),
    title: await page.title(),
  };
}

export async function clickSession(
  sessionId: string,
  x: number,
  y: number
): Promise<{ imageBase64: string; url: string; title: string }> {
  const session = await getSession(sessionId);
  if (!session) throw new Error("Session not found");

  const page = session.page;
  await page.mouse.click(x, y);
  await page.waitForTimeout(600);

  const imageBuffer = await page.screenshot({ type: "jpeg", quality: 85 });
  return {
    imageBase64: imageBuffer.toString("base64"),
    url: page.url(),
    title: await page.title(),
  };
}

export async function typeSession(
  sessionId: string,
  text: string,
  x?: number,
  y?: number
): Promise<{ imageBase64: string; url: string; title: string }> {
  const session = await getSession(sessionId);
  if (!session) throw new Error("Session not found");

  const page = session.page;
  if (x !== undefined && y !== undefined) {
    await page.mouse.click(x, y);
    await page.waitForTimeout(150);
  }
  await page.keyboard.type(text, { delay: 30 });
  await page.waitForTimeout(300);

  const imageBuffer = await page.screenshot({ type: "jpeg", quality: 85 });
  return {
    imageBase64: imageBuffer.toString("base64"),
    url: page.url(),
    title: await page.title(),
  };
}

export async function scrollSession(
  sessionId: string,
  deltaY: number
): Promise<{ imageBase64: string; url: string; title: string }> {
  const session = await getSession(sessionId);
  if (!session) throw new Error("Session not found");

  const page = session.page;
  await page.mouse.wheel(0, deltaY);
  await page.waitForTimeout(300);

  const imageBuffer = await page.screenshot({ type: "jpeg", quality: 85 });
  return {
    imageBase64: imageBuffer.toString("base64"),
    url: page.url(),
    title: await page.title(),
  };
}

export async function keySession(
  sessionId: string,
  key: string
): Promise<{ imageBase64: string; url: string; title: string }> {
  const session = await getSession(sessionId);
  if (!session) throw new Error("Session not found");

  const page = session.page;
  await page.keyboard.press(key);
  await page.waitForTimeout(400);

  const imageBuffer = await page.screenshot({ type: "jpeg", quality: 85 });
  return {
    imageBase64: imageBuffer.toString("base64"),
    url: page.url(),
    title: await page.title(),
  };
}

export async function goBackSession(
  sessionId: string
): Promise<{ imageBase64: string; url: string; title: string }> {
  const session = await getSession(sessionId);
  if (!session) throw new Error("Session not found");

  const page = session.page;
  await page.goBack({ waitUntil: "domcontentloaded", timeout: 10000 });
  await page.waitForTimeout(600);

  const imageBuffer = await page.screenshot({ type: "jpeg", quality: 85 });
  return {
    imageBase64: imageBuffer.toString("base64"),
    url: page.url(),
    title: await page.title(),
  };
}

export async function goForwardSession(
  sessionId: string
): Promise<{ imageBase64: string; url: string; title: string }> {
  const session = await getSession(sessionId);
  if (!session) throw new Error("Session not found");

  const page = session.page;
  await page.goForward({ waitUntil: "domcontentloaded", timeout: 10000 });
  await page.waitForTimeout(600);

  const imageBuffer = await page.screenshot({ type: "jpeg", quality: 85 });
  return {
    imageBase64: imageBuffer.toString("base64"),
    url: page.url(),
    title: await page.title(),
  };
}
