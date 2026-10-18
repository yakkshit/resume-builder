import { NextRequest, NextResponse } from "next/server";
import { createKernelBrowser, deleteKernelBrowser, executeKernelPlaywright } from "@/lib/kernel/kernel-client";

export const runtime = "nodejs";
export const maxDuration = 60;

function extractApiKey(req: NextRequest, body?: any): string | undefined {
  const headerKey = req.headers.get("x-kernel-api-key") || req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (headerKey && headerKey.trim()) return headerKey.trim();
  if (body?.apiKey && typeof body.apiKey === "string" && body.apiKey.trim()) return body.apiKey.trim();
  return process.env.KERNEL_API_KEY;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || "create_session";
    const apiKey = extractApiKey(req, body);

    if (action === "create_session") {
      const session = await createKernelBrowser({
        apiKey,
        startUrl: body.startUrl || body.url || "https://www.google.com",
        stealth: Boolean(body.stealth),
        headless: Boolean(body.headless),
        timeoutSeconds: body.timeoutSeconds,
      });

      return NextResponse.json({
        success: true,
        session,
        sessionId: session.sessionId,
        browserLiveViewUrl: session.browserLiveViewUrl,
        cdpWsUrl: session.cdpWsUrl,
        status: session.status,
      });
    }

    if (action === "destroy_session" || action === "delete_session") {
      const sessionId = body.sessionId || body.session_id;
      if (!sessionId) {
        return NextResponse.json({ success: true, message: "No active session ID provided" });
      }
      const res = await deleteKernelBrowser(sessionId, apiKey);
      return NextResponse.json(res);
    }

    if (action === "execute_playwright") {
      const sessionId = body.sessionId;
      const code = body.code;
      if (!sessionId || !code) {
        return NextResponse.json({ error: "Missing sessionId or code" }, { status: 400 });
      }
      const res = await executeKernelPlaywright(sessionId, code, apiKey);
      return NextResponse.json(res);
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: any) {
    console.error("[api/kernel/browser] Error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to process Kernel browser request",
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

    const res = await deleteKernelBrowser(sessionId, apiKey);
    return NextResponse.json(res);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to delete Kernel session" },
      { status: 500 }
    );
  }
}
