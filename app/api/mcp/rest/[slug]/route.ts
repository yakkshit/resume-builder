import { NextRequest, NextResponse } from "next/server";
import { ALL_MCP_TOOLS, executeMcpToolCall } from "@/lib/mcp/mcp-tools-catalog";
import {
  getUserMcpConfig,
  verifyMcpRequestAuth,
  checkAndConsumeQuota,
  getMcpUsageStats,
  logMcpExecution,
} from "@/lib/firebase/mcp-storage";

export const runtime = "nodejs";
export const maxDuration = 60;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key, x-user-id, x-mcp-slug, x-client-id, x-client-secret",
  "Access-Control-Expose-Headers": "X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "resume.cedzlabs.com";
    const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const baseUrl = `${proto}://${host}`;

    const mcpConfig = await getUserMcpConfig(slug);
    const usageStats = await getMcpUsageStats(mcpConfig.userId);
    const restEndpoint = `${baseUrl}/api/mcp/rest/${mcpConfig.slug}`;

    return NextResponse.json(
      {
        status: "ok",
        server: `mcp-${mcpConfig.slug}`,
        name: `Custom REST Endpoint for ${mcpConfig.slug}`,
        endpoint: restEndpoint,
        authType: mcpConfig.authType,
        isPublic: mcpConfig.isPublic || mcpConfig.authType === "none",
        dailyQuota: {
          limit: usageStats.limit,
          usedToday: usageStats.today.requestsCount,
          remaining: usageStats.remaining,
          resetsAt: usageStats.resetsAt,
        },
        sampleCurl: `curl -X POST ${restEndpoint} \\\n  -H "Content-Type: application/json" \\\n  ${mcpConfig.authType === "none" ? "" : `-H "Authorization: Bearer ${mcpConfig.bearerToken}" \\\n  `}-d '{"tool": "get_memory_vault", "args": {}}'`,
        toolsCount: ALL_MCP_TOOLS.length,
        tools: ALL_MCP_TOOLS.map((t) => ({
          name: t.name,
          category: t.category,
          description: t.description,
          inputSchema: t.inputSchema,
        })),
      },
      {
        headers: {
          ...corsHeaders,
          "X-RateLimit-Limit": String(usageStats.limit),
          "X-RateLimit-Remaining": String(usageStats.remaining),
          "X-RateLimit-Reset": usageStats.resetsAt,
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to retrieve user REST metadata" }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const startTime = Date.now();
  try {
    const { slug } = await params;
    const mcpConfig = await getUserMcpConfig(slug);

    const body = await req.json().catch(() => ({}));
    const { searchParams } = new URL(req.url);

    const toolName = body.tool || body.name || searchParams.get("tool");
    const toolArgs = body.args || body.arguments || body.params || {};

    if (!toolName) {
      return NextResponse.json(
        { error: "Missing required parameter 'tool'. Specify which tool to execute (e.g. 'search_jobs', 'get_memory_vault')" },
        { status: 400, headers: corsHeaders }
      );
    }

    const toolDef = ALL_MCP_TOOLS.find((t) => t.name === toolName);
    if (!toolDef) {
      return NextResponse.json(
        { error: `Tool '${toolName}' not found in tools catalog.` },
        { status: 404, headers: corsHeaders }
      );
    }

    // Verify authentication
    const authResult = verifyMcpRequestAuth(req, mcpConfig);
    if (!authResult.authorized) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: authResult.error || "Authentication failed. Provide valid credentials for this endpoint.",
          authTypeConfigured: mcpConfig.authType,
        },
        { status: 401, headers: corsHeaders }
      );
    }

    // Quota check (100 requests per day)
    const quota = await checkAndConsumeQuota(mcpConfig.userId, 1);
    if (!quota.allowed) {
      await logMcpExecution({
        userId: mcpConfig.userId,
        tool: toolName,
        protocol: "rest",
        authType: authResult.authTypeUsed,
        status: "rate_limited",
        durationMs: Date.now() - startTime,
        tokensUsed: 0,
        error: quota.message,
      });

      return NextResponse.json(
        {
          error: "Too Many Requests",
          message: quota.message || "Daily quota of 100 requests exceeded. Resets at midnight UTC.",
          quota: {
            limit: quota.limit,
            used: quota.used,
            remaining: 0,
            resetsAt: quota.resetsAt,
          },
        },
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "X-RateLimit-Limit": String(quota.limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": quota.resetsAt,
          },
        }
      );
    }

    // Execute tool
    const toolResult = await executeMcpToolCall(toolName, toolArgs, { userId: mcpConfig.userId, req });

    let parsedResult: any = toolResult;
    try {
      if (toolResult.content?.[0]?.text) {
        parsedResult = JSON.parse(toolResult.content[0].text);
      }
    } catch {
      parsedResult = toolResult.content?.[0]?.text || toolResult;
    }

    // Log to Firebase & memory
    await logMcpExecution({
      userId: mcpConfig.userId,
      tool: toolName,
      protocol: "rest",
      authType: authResult.authTypeUsed,
      status: toolResult.isError ? "error" : "success",
      durationMs: Date.now() - startTime,
      tokensUsed: Math.floor(JSON.stringify(parsedResult).length / 4),
      inputSummary: JSON.stringify(toolArgs).slice(0, 100),
    });

    return NextResponse.json(
      {
        success: !toolResult.isError,
        tool: toolName,
        result: parsedResult,
        quota: {
          limit: quota.limit,
          used: quota.used,
          remaining: quota.remaining,
          resetsAt: quota.resetsAt,
        },
        durationMs: Date.now() - startTime,
      },
      {
        headers: {
          ...corsHeaders,
          "X-RateLimit-Limit": String(quota.limit),
          "X-RateLimit-Remaining": String(quota.remaining),
          "X-RateLimit-Reset": quota.resetsAt,
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500, headers: corsHeaders });
  }
}

