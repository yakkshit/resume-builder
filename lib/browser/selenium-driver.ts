import { Builder, By, Key, WebDriver } from "selenium-webdriver";
import type { IBrowserDriver, BrowserSession, ScreenshotResult } from "./browser-driver";

interface SeleniumSession extends BrowserSession {
  driver: WebDriver;
}

export class SeleniumDriver implements IBrowserDriver {
  private sessions = new Map<string, SeleniumSession>();
  private readonly SESSION_TTL_MS = 10 * 60 * 1000;

  constructor() {
    // Background cleanup
    setInterval(() => this.cleanupIdleSessions(), this.SESSION_TTL_MS);
  }

  private async getDriver(id: string): Promise<WebDriver> {
    const session = this.sessions.get(id);
    if (!session) throw new Error("Session not found");
    session.lastUsedAt = Date.now();
    return session.driver;
  }

  async createSession(): Promise<string> {
    // Selenium Manager (v4.6+) automatically downloads drivers.
    const driver = await new Builder().forBrowser("chrome").build();
    
    // Set 1280x900 viewport
    await driver.manage().window().setRect({ width: 1280, height: 900 });

    const id = `session_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    this.sessions.set(id, {
      id,
      driver,
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
      await session.driver.quit();
    } catch (e) {
      console.error("Failed to quit Selenium driver:", e);
    }
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

  private async generateScreenshot(driver: WebDriver): Promise<ScreenshotResult> {
    const imageBase64 = await driver.takeScreenshot();
    const url = await driver.getCurrentUrl();
    const title = await driver.getTitle();
    const historyLength = await driver.executeScript("return window.history.length") as number;
    
    return {
      imageBase64,
      url,
      title,
      canGoBack: historyLength > 1,
      canGoForward: false, // Similar to Playwright fallback
    };
  }

  async takeScreenshot(sessionId: string): Promise<ScreenshotResult> {
    const driver = await this.getDriver(sessionId);
    return this.generateScreenshot(driver);
  }

  async navigateSession(sessionId: string, url: string): Promise<ScreenshotResult> {
    const driver = await this.getDriver(sessionId);
    await driver.get(url);
    await driver.sleep(800);
    return this.generateScreenshot(driver);
  }

  async clickSession(sessionId: string, x: number, y: number): Promise<ScreenshotResult> {
    const driver = await this.getDriver(sessionId);
    // Use the action API to move to coordinates and click
    const actions = driver.actions({ async: true });
    // Note: Selenium actions are relative to the viewport top-left
    // Moving by offset requires an element in some bindings, but in recent selenium-webdriver we can move by origin
    await driver.executeScript(`
      const el = document.elementFromPoint(arguments[0], arguments[1]);
      if (el) el.click();
    `, x, y);
    
    await driver.sleep(600);
    return this.generateScreenshot(driver);
  }

  async typeSession(sessionId: string, text: string, x?: number, y?: number): Promise<ScreenshotResult> {
    const driver = await this.getDriver(sessionId);
    
    if (x !== undefined && y !== undefined) {
      await driver.executeScript(`
        const el = document.elementFromPoint(arguments[0], arguments[1]);
        if (el) el.focus();
      `, x, y);
      await driver.sleep(150);
    }

    const activeElement = await driver.switchTo().activeElement();
    await activeElement.sendKeys(text);
    await driver.sleep(300);
    
    return this.generateScreenshot(driver);
  }

  async scrollSession(sessionId: string, deltaY: number): Promise<ScreenshotResult> {
    const driver = await this.getDriver(sessionId);
    await driver.executeScript(`window.scrollBy(0, arguments[0]);`, deltaY);
    await driver.sleep(300);
    return this.generateScreenshot(driver);
  }

  async keySession(sessionId: string, key: string): Promise<ScreenshotResult> {
    const driver = await this.getDriver(sessionId);
    const activeElement = await driver.switchTo().activeElement();
    
    let seleniumKey = key;
    if (key === "Enter") seleniumKey = Key.ENTER;
    else if (key === "Escape") seleniumKey = Key.ESCAPE;
    else if (key === "Backspace") seleniumKey = Key.BACK_SPACE;
    else if (key === "Tab") seleniumKey = Key.TAB;

    await activeElement.sendKeys(seleniumKey);
    await driver.sleep(400);
    return this.generateScreenshot(driver);
  }

  async goBackSession(sessionId: string): Promise<ScreenshotResult> {
    const driver = await this.getDriver(sessionId);
    await driver.navigate().back();
    await driver.sleep(600);
    return this.generateScreenshot(driver);
  }

  async goForwardSession(sessionId: string): Promise<ScreenshotResult> {
    const driver = await this.getDriver(sessionId);
    await driver.navigate().forward();
    await driver.sleep(600);
    return this.generateScreenshot(driver);
  }
}
