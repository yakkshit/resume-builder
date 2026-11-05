import { NextRequest, NextResponse } from "next/server";
import {
  getUserMcpConfig,
  saveUserMcpConfig,
  getMcpUsageStats,
  getRecentMcpLogs,
  type UserMcpConfig,
} from "@/lib/firebase/mcp-storage";
import { ALL_MCP_TOOLS } from "@/lib/mcp/mcp-tools-catalog";

export const runtime = "nodejs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key, x-user-id",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const userId = searchParams.get("userId") || req.headers.get("x-user-id") || "default-user";
    const lookupKey = slug || userId;

    const host = req.headers.get("host") || "localhost:3000";
    const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const baseUrl = `${proto}://${host}`;

    const config = await getUserMcpConfig(lookupKey);
    const stats = await getMcpUsageStats(config.userId);
    const logs = await getRecentMcpLogs(config.userId, 25);

    return NextResponse.json(
      {
        success: true,
        config,
        stats: {
          limit: stats.limit,
          used: stats.today.requestsCount,
          remaining: stats.remaining,
          resetsAt: stats.resetsAt,
          tokensUsed: stats.today.tokensUsed,
          toolCounts: stats.today.toolCounts,
        },
        endpoints: {
          mcp: `${baseUrl}/api/mcp/${config.slug}`,
          rest: `${baseUrl}/api/mcp/rest/${config.slug}`,
          baseMcp: `${baseUrl}/api/mcp`,
          baseRest: `${baseUrl}/api/mcp/rest`,
        },
        logs,
        tools: ALL_MCP_TOOLS.map((t) => ({
          name: t.name,
          category: t.category,
          description: t.description,
          inputSchema: t.inputSchema,
        })),
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch user MCP config" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = body.userId || req.headers.get("x-user-id") || "default-user";

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400, headers: corsHeaders });
    }

    const updated = await saveUserMcpConfig({
      ...body,
      userId,
    });

    const host = req.headers.get("host") || "localhost:3000";
    const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const baseUrl = `${proto}://${host}`;

    const stats = await getMcpUsageStats(updated.userId);

    return NextResponse.json(
      {
        success: true,
        config: updated,
        stats: {
          limit: stats.limit,
          used: stats.today.requestsCount,
          remaining: stats.remaining,
          resetsAt: stats.resetsAt,
          tokensUsed: stats.today.tokensUsed ?? 0,
          toolCounts: stats.today.toolCounts ?? {},
        },
        endpoints: {
          mcp: `${baseUrl}/api/mcp/${updated.slug}`,
          rest: `${baseUrl}/api/mcp/rest/${updated.slug}`,
        },
        message: "Dynamic MCP configuration saved successfully in Firebase.",
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to save user MCP config" },
      { status: 500, headers: corsHeaders }
    );
  }
}

