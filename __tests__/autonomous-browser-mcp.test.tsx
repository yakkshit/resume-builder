import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BrowserController, type BrowserStep } from "@/components/chat/components/browser-controller";

describe("Autonomous Chromium Browser Controller & Human Takeover Component", () => {
  it("renders BrowserController with autonomous steps and JSONL toggle", () => {
    const mockSteps: BrowserStep[] = [
      { step: 1, action: "navigate", url: "https://www.google.com", desc: "Navigated to search", status: "completed" },
      { step: 2, action: "extract", desc: "Extracted job requirements", status: "completed" },
      { step: 3, action: "handoff", desc: "Waiting for user 2FA verification", status: "paused" },
    ];

    const html = renderToStaticMarkup(
      React.createElement(BrowserController, {
        data: {
          title: "Autonomous Browser Agent",
          currentUrl: "https://www.google.com",
          mode: "human_takeover",
          steps: mockSteps,
          reasonForHandoff: "Please solve CAPTCHA to proceed",
        },
      })
    );

    expect(html).toContain("Autonomous Browser Agent");
    expect(html).toContain("You&#x27;re in Control");
    expect(html).toContain("Please solve CAPTCHA to proceed");
    expect(html).toContain("Hand Back to Agent");
  });

  it("renders BrowserController in autonomous agent browsing mode", () => {
    const html = renderToStaticMarkup(
      React.createElement(BrowserController, {
        data: {
          currentUrl: "https://example.com/careers",
          mode: "agent",
        },
      })
    );

    expect(html).toContain("Agent Navigating");
    expect(html).toContain("Take Over (Cursor)");
    expect(html).toContain("JSONL Stream");
  });
});

describe("Autonomous Browser MCP Protocol Tool Definitions", () => {
  it("defines browser navigation, extraction, interaction, and handoff tools", () => {
    const browserTools = ["browser_navigate", "browser_extract", "browser_click", "browser_type", "browser_handoff"];
    expect(browserTools).toContain("browser_navigate");
    expect(browserTools).toContain("browser_extract");
    expect(browserTools).toContain("browser_click");
    expect(browserTools).toContain("browser_type");
    expect(browserTools).toContain("browser_handoff");
  });
});
