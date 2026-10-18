import { NextRequest, NextResponse } from "next/server";
import {
  createBrowserbaseSession,
  deleteBrowserbaseSession,
  fetchBrowserbasePage,
} from "@/lib/browserbase/browserbase-client";

export const runtime = "nodejs";
export const maxDuration = 60;

function extractApiKey(req: NextRequest, body?: any): string | undefined {
  const headerKey =
    req.headers.get("x-bb-api-key") ||
    req.headers.get("x-browserbase-api-key") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (headerKey && headerKey.trim()) return headerKey.trim();
  if (body?.apiKey && typeof body.apiKey === "string" && body.apiKey.trim()) return body.apiKey.trim();
  return process.env.BROWSERBASE_API_KEY;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || "create_session";
    const apiKey = extractApiKey(req, body);

    if (action === "create_session") {
      const session = await createBrowserbaseSession({
        apiKey,
        startUrl: body.startUrl || body.url || "https://www.google.com",
        proxies: Boolean(body.proxies),
        keepAlive: Boolean(body.keepAlive),
        timeoutSeconds: body.timeoutSeconds,
      });

      return NextResponse.json({
        success: true,
        session,
        sessionId: session.sessionId,
        browserLiveViewUrl: session.browserLiveViewUrl,
        connectUrl: session.connectUrl,
        debuggerUrl: session.debuggerUrl,
        status: session.status,
      });
    }

    if (action === "destroy_session" || action === "delete_session") {
      const sessionId = body.sessionId || body.session_id;
      if (!sessionId) {
        return NextResponse.json({ success: true, message: "No active session ID provided" });
      }
      const res = await deleteBrowserbaseSession(sessionId, apiKey);
      return NextResponse.json(res);
    }

    if (action === "fetch_page") {
      const url = body.url;
      if (!url) {
        return NextResponse.json({ error: "Missing url for fetch_page" }, { status: 400 });
      }
      const res = await fetchBrowserbasePage(url, apiKey);
      return NextResponse.json(res);
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: any) {
    console.error("[api/browserbase/browser] Error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to process Browserbase request",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const sessionId = url.searchParams.get("sessionId") || url.searchParams.get("id");
    const apiKey = extractApiKey(req);

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId query parameter is required" }, { status: 400 });
    }

    const res = await deleteBrowserbaseSession(sessionId, apiKey);
    return NextResponse.json(res);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to delete Browserbase session" },
      { status: 500 }
    );
  }
}
