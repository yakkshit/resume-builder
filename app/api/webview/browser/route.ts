import { NextRequest, NextResponse } from "next/server";

// Lazy-import the Playwright service (server-only, singleton)
async function getService() {
  return await import("@/lib/browser/playwright-service");
}

function ok(data: object) {
  return NextResponse.json({ success: true, ...data }, {
    headers: { "Access-Control-Allow-Origin": "*" },
  });
}

function err(msg: string, status = 500) {
  return NextResponse.json({ success: false, error: msg }, {
    status,
    headers: { "Access-Control-Allow-Origin": "*" },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, sessionId, url, x, y, text, key, deltaY } = body;

    const svc = await getService();

    switch (action) {
      case "create_session": {
        const id = await svc.createSession();
        // Navigate to initial URL if provided
        if (url) {
          const result = await svc.navigateSession(id, url);
          return ok({ sessionId: id, ...result });
        }
        return ok({ sessionId: id });
      }

      case "navigate": {
        if (!sessionId) return err("Missing sessionId", 400);
        if (!url) return err("Missing url", 400);
        const result = await svc.navigateSession(sessionId, url);
        return ok(result);
      }

      case "screenshot": {
        if (!sessionId) return err("Missing sessionId", 400);
        const result = await svc.takeScreenshot(sessionId);
        return ok(result);
      }

      case "click": {
        if (!sessionId) return err("Missing sessionId", 400);
        if (x === undefined || y === undefined) return err("Missing x/y", 400);
        const result = await svc.clickSession(sessionId, x, y);
        return ok(result);
      }

      case "type": {
        if (!sessionId) return err("Missing sessionId", 400);
        if (!text) return err("Missing text", 400);
        const result = await svc.typeSession(sessionId, text, x, y);
        return ok(result);
      }

      case "scroll": {
        if (!sessionId) return err("Missing sessionId", 400);
        const result = await svc.scrollSession(sessionId, deltaY ?? 300);
        return ok(result);
      }

      case "key": {
        if (!sessionId) return err("Missing sessionId", 400);
        if (!key) return err("Missing key", 400);
        const result = await svc.keySession(sessionId, key);
        return ok(result);
      }

      case "back": {
        if (!sessionId) return err("Missing sessionId", 400);
        const result = await svc.goBackSession(sessionId);
        return ok(result);
      }

      case "forward": {
        if (!sessionId) return err("Missing sessionId", 400);
        const result = await svc.goForwardSession(sessionId);
        return ok(result);
      }

      case "destroy_session": {
        if (!sessionId) return err("Missing sessionId", 400);
        await svc.destroySession(sessionId);
        return ok({ message: "Session destroyed" });
      }

      default:
        return err(`Unknown action: ${action}`, 400);
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[playwright-browser] Error:", msg);

    // If Playwright isn't installed/available, return a clear message
    if (msg.includes("Cannot find module") || msg.includes("playwright")) {
      return err(
        "Playwright browser not available. Run: npx playwright install chromium",
        503
      );
    }

    return err(msg);
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
