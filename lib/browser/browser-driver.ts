export interface BrowserSession {
  id: string;
  createdAt: number;
  lastUsedAt: number;
}

export interface ScreenshotResult {
  imageBase64: string;
  url: string;
  title: string;
  canGoBack?: boolean;
  canGoForward?: boolean;
}

export interface IBrowserDriver {
  createSession(): Promise<string>;
  getSession(id: string): Promise<BrowserSession | null>;
  destroySession(id: string): Promise<void>;
  
  takeScreenshot(sessionId: string): Promise<ScreenshotResult>;
  navigateSession(sessionId: string, url: string): Promise<ScreenshotResult>;
  clickSession(sessionId: string, x: number, y: number): Promise<ScreenshotResult>;
  typeSession(sessionId: string, text: string, x?: number, y?: number): Promise<ScreenshotResult>;
  scrollSession(sessionId: string, deltaY: number): Promise<ScreenshotResult>;
  keySession(sessionId: string, key: string): Promise<ScreenshotResult>;
  goBackSession(sessionId: string): Promise<ScreenshotResult>;
  goForwardSession(sessionId: string): Promise<ScreenshotResult>;
}
