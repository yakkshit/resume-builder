import type { Browser, BrowserContext, Page } from "playwright-core";
import type { IBrowserDriver, BrowserSession, ScreenshotResult } from "./browser-driver";

interface PlaywrightSession extends BrowserSession {
  page: Page;
  context: BrowserContext;
}

export class PlaywrightDriver implements IBrowserDriver {
  private browser: Browser | null = null;
  private sessions = new Map<string, PlaywrightSession>();
  private readonly SESSION_TTL_MS = 10 * 60 * 1000;

  constructor() {
    setInterval(() => this.cleanupIdleSessions(), this.SESSION_TTL_MS);
  }

  private async getBrowser(): Promise<Browser> {
    if (this.browser && this.browser.isConnected()) return this.browser;

    const { chromium } = await import("playwright-core");

    if (process.env.VERCEL || process.env.NEXT_PUBLIC_VERCEL_ENV) {
      try {
        const sparticuz = (await import("@sparticuz/chromium")).default || await import("@sparticuz/chromium");
        this.browser = await chromium.launch({
          args: sparticuz.args,
          executablePath: await sparticuz.executablePath(),
          headless: true,
        });

        this.browser.on("disconnected", () => {
          this.browser = null;
          this.sessions.clear();
        });

        return this.browser;
      } catch (err) {
        console.warn("Failed to launch @sparticuz/chromium. Falling back...", err);
      }
    }

    const possiblePaths = [
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Chromium.app/Contents/MacOS/Chromium",
      "/usr/bin/chromium-browser",
      "/usr/bin/chromium",
      "/usr/bin/google-chrome",
    ];

    const { existsSync } = await import("fs");
    const systemChrome = possiblePaths.find((p) => existsSync(p));

    this.browser = await chromium.launch({
      headless: true,
      executablePath: systemChrome || undefined,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
        "--disable-web-security",
        "--disable-features=IsolateOrigins,site-per-process",
        "--window-size=1280,900",
      ],
    });

    this.browser.on("disconnected", () => {
      this.browser = null;
      this.sessions.clear();
    });

    return this.browser;
  }

  async createSession(): Promise<string> {
    const b = await this.getBrowser();

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
    this.sessions.set(id, {
      id,
      page,
      context,
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
    });

    return id;
  }

  async getSession(id: string): Promise<BrowserSession | null> {
    const session = this.sessions.get(id);
    if (!session) return null;
    session.lastUsedAt = Date.now();
    return {
      id: session.id,
      createdAt: session.createdAt,
      lastUsedAt: session.lastUsedAt,
    };
  }

  async destroySession(id: string): Promise<void> {
    const session = this.sessions.get(id);
    if (!session) return;
    try {
      await session.context.close();
    } catch {}
    this.sessions.delete(id);
  }

  private cleanupIdleSessions(): void {
    const now = Date.now();
    for (const [id, session] of this.sessions.entries()) {
      if (now - session.lastUsedAt > this.SESSION_TTL_MS) {
        this.destroySession(id).catch(() => {});
      }
    }
  }

  private async getPage(id: string): Promise<Page> {
    const session = this.sessions.get(id);
    if (!session) throw new Error("Session not found");
    session.lastUsedAt = Date.now();
    return session.page;
  }

  async takeScreenshot(sessionId: string): Promise<ScreenshotResult> {
    const page = await this.getPage(sessionId);
    const imageBuffer = await page.screenshot({ type: "jpeg", quality: 85, fullPage: false });

    return {
      imageBase64: imageBuffer.toString("base64"),
      url: page.url(),
      title: await page.title(),
      canGoBack: await page.evaluate(() => window.history.length > 1),
      canGoForward: false,
    };
  }

  async navigateSession(sessionId: string, url: string): Promise<ScreenshotResult> {
    const page = await this.getPage(sessionId);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(800);

    const imageBuffer = await page.screenshot({ type: "jpeg", quality: 85 });
    return {
      imageBase64: imageBuffer.toString("base64"),
      url: page.url(),
      title: await page.title(),
    };
  }

  async clickSession(sessionId: string, x: number, y: number): Promise<ScreenshotResult> {
    const page = await this.getPage(sessionId);
    await page.mouse.click(x, y);
    await page.waitForTimeout(600);

    const imageBuffer = await page.screenshot({ type: "jpeg", quality: 85 });
    return {
      imageBase64: imageBuffer.toString("base64"),
      url: page.url(),
      title: await page.title(),
    };
  }

  async typeSession(sessionId: string, text: string, x?: number, y?: number): Promise<ScreenshotResult> {
    const page = await this.getPage(sessionId);
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

  async scrollSession(sessionId: string, deltaY: number): Promise<ScreenshotResult> {
    const page = await this.getPage(sessionId);
    await page.mouse.wheel(0, deltaY);
    await page.waitForTimeout(300);

    const imageBuffer = await page.screenshot({ type: "jpeg", quality: 85 });
    return {
      imageBase64: imageBuffer.toString("base64"),
      url: page.url(),
      title: await page.title(),
    };
  }

  async keySession(sessionId: string, key: string): Promise<ScreenshotResult> {
    const page = await this.getPage(sessionId);
    await page.keyboard.press(key);
    await page.waitForTimeout(400);

    const imageBuffer = await page.screenshot({ type: "jpeg", quality: 85 });
    return {
      imageBase64: imageBuffer.toString("base64"),
      url: page.url(),
      title: await page.title(),
    };
  }

  async goBackSession(sessionId: string): Promise<ScreenshotResult> {
    const page = await this.getPage(sessionId);
    await page.goBack({ waitUntil: "domcontentloaded", timeout: 10000 });
    await page.waitForTimeout(600);

    const imageBuffer = await page.screenshot({ type: "jpeg", quality: 85 });
    return {
      imageBase64: imageBuffer.toString("base64"),
      url: page.url(),
      title: await page.title(),
    };
  }

  async goForwardSession(sessionId: string): Promise<ScreenshotResult> {
    const page = await this.getPage(sessionId);
    await page.goForward({ waitUntil: "domcontentloaded", timeout: 10000 });
    await page.waitForTimeout(600);

    const imageBuffer = await page.screenshot({ type: "jpeg", quality: 85 });
    return {
      imageBase64: imageBuffer.toString("base64"),
      url: page.url(),
      title: await page.title(),
    };
  }
}
