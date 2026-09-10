import { PlaywrightDriver } from "./playwright-driver";
import { SeleniumDriver } from "./selenium-driver";
import type { IBrowserDriver, BrowserSession, ScreenshotResult } from "./browser-driver";

let driverInstance: IBrowserDriver | null = null;

async function getDriver(): Promise<IBrowserDriver> {
  if (driverInstance) return driverInstance;

  try {
    console.log("Attempting to initialize Playwright driver...");
    const pwDriver = new PlaywrightDriver();
    // Test initialization by creating and destroying a session
    const id = await pwDriver.createSession();
    await pwDriver.destroySession(id);
    driverInstance = pwDriver;
    console.log("Playwright driver initialized successfully.");
    return driverInstance;
  } catch (error) {
    console.warn("Playwright initialization failed. Falling back to Selenium driver.", error);
    driverInstance = new SeleniumDriver();
    return driverInstance;
  }
}

export async function createSession(): Promise<string> {
  const driver = await getDriver();
  return driver.createSession();
}

export async function getSession(id: string): Promise<BrowserSession | null> {
  const driver = await getDriver();
  return driver.getSession(id);
}

export async function destroySession(id: string): Promise<void> {
  const driver = await getDriver();
  return driver.destroySession(id);
}

export async function takeScreenshot(sessionId: string): Promise<ScreenshotResult> {
  const driver = await getDriver();
  return driver.takeScreenshot(sessionId);
}

export async function navigateSession(
  sessionId: string,
  url: string
): Promise<ScreenshotResult> {
  const driver = await getDriver();
  return driver.navigateSession(sessionId, url);
}

export async function clickSession(
  sessionId: string,
  x: number,
  y: number
): Promise<ScreenshotResult> {
  const driver = await getDriver();
  return driver.clickSession(sessionId, x, y);
}

export async function typeSession(
  sessionId: string,
  text: string,
  x?: number,
  y?: number
): Promise<ScreenshotResult> {
  const driver = await getDriver();
  return driver.typeSession(sessionId, text, x, y);
}

export async function scrollSession(
  sessionId: string,
  deltaY: number
): Promise<ScreenshotResult> {
  const driver = await getDriver();
  return driver.scrollSession(sessionId, deltaY);
}

export async function keySession(
  sessionId: string,
  key: string
): Promise<ScreenshotResult> {
  const driver = await getDriver();
  return driver.keySession(sessionId, key);
}

export async function goBackSession(
  sessionId: string
): Promise<ScreenshotResult> {
  const driver = await getDriver();
  return driver.goBackSession(sessionId);
}

export async function goForwardSession(
  sessionId: string
): Promise<ScreenshotResult> {
  const driver = await getDriver();
  return driver.goForwardSession(sessionId);
}
