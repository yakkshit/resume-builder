import { NextRequest, NextResponse } from "next/server";
import {
  createSteelSession,
  deleteSteelSession,
  scrapeWithSteel,
} from "@/lib/steel/steel-client";

export const runtime = "nodejs";
export const maxDuration = 60;

function extractApiKey(req: NextRequest, body?: any): string | undefined {
  const headerKey =
    req.headers.get("steel-api-key") ||
    req.headers.get("x-steel-api-key") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (headerKey && headerKey.trim()) return headerKey.trim();
  if (body?.apiKey && typeof body.apiKey === "string" && body.apiKey.trim()) return body.apiKey.trim();
  return process.env.STEEL_API_KEY;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || "create_session";
    const apiKey = extractApiKey(req, body);

    if (action === "create_session") {
      const session = await createSteelSession({
        apiKey,
        startUrl: body.startUrl || body.url || "https://www.google.com",
        sessionTimeoutMs: body.sessionTimeoutMs || body.timeoutSeconds ? (body.timeoutSeconds * 1000) : undefined,
        dimensions: body.dimensions,
      });

      return NextResponse.json({
        success: true,
        session,
        sessionId: session.sessionId,
        browserLiveViewUrl: session.browserLiveViewUrl,
        websocketUrl: session.websocketUrl,
        debugUrl: session.debugUrl,
        sessionViewerUrl: session.sessionViewerUrl,
        status: session.status,
      });
    }

    if (action === "destroy_session" || action === "delete_session") {
      const sessionId = body.sessionId || body.session_id;
      if (!sessionId) {
        return NextResponse.json({ success: true, message: "No active session ID provided" });
      }
      const res = await deleteSteelSession(sessionId, apiKey);
      return NextResponse.json(res);
    }

    if (action === "scrape") {
      const url = body.url;
      if (!url) {
        return NextResponse.json({ error: "Missing url for scrape" }, { status: 400 });
      }
      const res = await scrapeWithSteel(url, apiKey);
      return NextResponse.json(res);
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: any) {
    console.error("[api/steel/browser] Error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to process Steel request",
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

    const res = await deleteSteelSession(sessionId, apiKey);
    return NextResponse.json(res);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to delete Steel session" },
      { status: 500 }
    );
  }
}
