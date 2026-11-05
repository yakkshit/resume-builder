import { NextRequest, NextResponse } from "next/server";
import { ALL_MCP_TOOLS, executeMcpToolCall } from "@/lib/mcp/mcp-tools-catalog";
import {
  getUserMcpConfig,
  verifyMcpRequestAuth,
  checkAndConsumeQuota,
  getMcpUsageStats,
  logMcpExecution,
  extractAuthTokenFromRequest,
} from "@/lib/firebase/mcp-storage";

export const runtime = "nodejs";
export const maxDuration = 60;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key, x-user-id, x-mcp-slug, x-client-id, x-client-secret, mcp-session-id",
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

    const customUserMcpEndpoint = `${baseUrl}/api/mcp/${encodeURIComponent(mcpConfig.slug)}`;
    const customUserRestEndpoint = `${baseUrl}/api/mcp/rest/${encodeURIComponent(mcpConfig.slug)}`;

    return NextResponse.json(
      {
        status: "ok",
        server: `mcp-${mcpConfig.slug}`,
        name: `Dynamic MCP Server (${mcpConfig.slug})`,
        protocolVersion: "2024-11-05",
        endpoint: customUserMcpEndpoint,
        restEndpoint: customUserRestEndpoint,
        authType: mcpConfig.authType,
        isPublic: mcpConfig.isPublic || mcpConfig.authType === "none",
        dailyQuota: {
          limit: usageStats.limit,
          usedToday: usageStats.today.requestsCount,
          remaining: usageStats.remaining,
          resetsAt: usageStats.resetsAt,
        },
        methods: ["initialize", "ping", "tools/list", "tools/call", "resources/list", "prompts/list"],
        supportedTools: ALL_MCP_TOOLS.map((t) => t.name),
        tools: ALL_MCP_TOOLS,
        clientConfigurations: {
          cursor: {
            configPath: "~/.cursor/mcp.json",
            json: {
              mcpServers: {
                [mcpConfig.slug]: {
                  url: customUserMcpEndpoint,
                  headers: mcpConfig.authType === "none" ? {} : { Authorization: `Bearer ${mcpConfig.bearerToken}` },
                },
              },
            },
          },
          claudeCode: {
            command: mcpConfig.authType === "none"
              ? `claude mcp add ${mcpConfig.slug} ${customUserMcpEndpoint}`
              : `claude mcp add ${mcpConfig.slug} ${customUserMcpEndpoint} --header "Authorization: Bearer ${mcpConfig.bearerToken}"`,
          },
          claudeDesktop: {
            configPath: "~/Library/Application Support/Claude/claude_desktop_config.json",
            json: {
              mcpServers: {
                [mcpConfig.slug]: {
                  command: "npx",
                  args: mcpConfig.authType === "none"
                    ? ["-y", "mcp-remote", customUserMcpEndpoint]
                    : ["-y", "mcp-remote", customUserMcpEndpoint, "--header", `Authorization: Bearer ${mcpConfig.bearerToken}`],
                },
              },
            },
          },
          windsurf: {
            configPath: "~/.codeium/windsurf/mcp_config.json",
            json: {
              mcpServers: {
                [mcpConfig.slug]: {
                  serverUrl: customUserMcpEndpoint,
                  headers: mcpConfig.authType === "none" ? {} : { Authorization: `Bearer ${mcpConfig.bearerToken}` },
                },
              },
            },
          },
          restApi: {
            description: "Direct REST endpoint for calling tools without an MCP client",
            endpoint: customUserRestEndpoint,
            exampleCurl: `curl -X POST ${customUserRestEndpoint} \\\n  -H "Content-Type: application/json" \\\n  ${mcpConfig.authType === "none" ? "" : `-H "Authorization: Bearer ${mcpConfig.bearerToken}" \\\n  `}-d '{"tool": "get_memory_vault", "args": {}}'`,
          },
        },
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
    return NextResponse.json({ error: err.message || "Failed to retrieve user MCP metadata" }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const startTime = Date.now();
  try {
    const { slug } = await params;
    const mcpConfig = await getUserMcpConfig(slug);
    const json = await req.json().catch(() => ({}));
    const { jsonrpc, id, method, params: methodParams } = json;

    if (!method) {
      return NextResponse.json(
        { jsonrpc: "2.0", id: id ?? null, error: { code: -32600, message: "Invalid Request: missing method" } },
        { headers: corsHeaders, status: 400 }
      );
    }

    if (method === "initialize") {
      return NextResponse.json(
        {
          jsonrpc: "2.0",
          id,
          result: {
            protocolVersion: "2024-11-05",
            capabilities: { tools: {}, resources: {}, prompts: {}, logging: {} },
            serverInfo: { name: `mcp-${mcpConfig.slug}`, version: "2.0.0" },
          },
        },
        { headers: corsHeaders }
      );
    }

    if (method === "notifications/initialized") {
      return new NextResponse(null, { status: 204, headers: corsHeaders });
    }

    if (method === "ping") {
      return NextResponse.json({ jsonrpc: "2.0", id, result: {} }, { headers: corsHeaders });
    }

    if (method === "tools/list") {
      return NextResponse.json({ jsonrpc: "2.0", id, result: { tools: ALL_MCP_TOOLS } }, { headers: corsHeaders });
    }

    if (method === "resources/list") {
      return NextResponse.json({ jsonrpc: "2.0", id, result: { resources: [] } }, { headers: corsHeaders });
    }

    if (method === "prompts/list") {
      return NextResponse.json({ jsonrpc: "2.0", id, result: { prompts: [] } }, { headers: corsHeaders });
    }

    if (method === "tools/call") {
      const { name, arguments: toolArgs } = methodParams || {};
      const toolDef = ALL_MCP_TOOLS.find((t) => t.name === name);
      if (!toolDef) {
        return NextResponse.json(
          { jsonrpc: "2.0", id, error: { code: -32601, message: `Tool '${name}' is not found.` } },
          { headers: corsHeaders, status: 403 }
        );
      }

      // Authorization verification
      const authResult = verifyMcpRequestAuth(req, mcpConfig, name);
      if (!authResult.authorized) {
        return NextResponse.json(
          {
            jsonrpc: "2.0",
            id,
            error: {
              code: -32001,
              message: authResult.error || "Authentication failed. Provide valid credentials for this user's MCP.",
            },
          },
          { headers: corsHeaders, status: 401 }
        );
      }

      // Quota check (100 requests per day)
      const quota = await checkAndConsumeQuota(mcpConfig.userId, 1);
      if (!quota.allowed) {
        await logMcpExecution({
          userId: mcpConfig.userId,
          tool: name,
          protocol: "mcp",
          authType: authResult.authTypeUsed,
          status: "rate_limited",
          durationMs: Date.now() - startTime,
          tokensUsed: 0,
          error: quota.message,
        });

        return NextResponse.json(
          {
            jsonrpc: "2.0",
            id,
            error: { code: -32000, message: quota.message || "Daily quota exceeded (100 req/day)." },
          },
          {
            headers: {
              ...corsHeaders,
              "X-RateLimit-Limit": String(quota.limit),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": quota.resetsAt,
            },
            status: 429,
          }
        );
      }

      // Execute tool call
      const toolResult = await executeMcpToolCall(name, toolArgs, { userId: mcpConfig.userId, req });

      // Log execution in Firebase & memory
      await logMcpExecution({
        userId: mcpConfig.userId,
        tool: name,
        protocol: "mcp",
        authType: authResult.authTypeUsed,
        status: toolResult.isError ? "error" : "success",
        durationMs: Date.now() - startTime,
        tokensUsed: Math.floor(JSON.stringify(toolResult).length / 4),
        inputSummary: JSON.stringify(toolArgs || {}).slice(0, 100),
      });

      return NextResponse.json(
        { jsonrpc: "2.0", id, result: toolResult },
        {
          headers: {
            ...corsHeaders,
            "X-RateLimit-Limit": String(quota.limit),
            "X-RateLimit-Remaining": String(quota.remaining),
            "X-RateLimit-Reset": quota.resetsAt,
          },
        }
      );
    }

    return NextResponse.json(
      { jsonrpc: "2.0", id, error: { code: -32601, message: `Method not found: ${method}` } },
      { headers: corsHeaders }
    );
  } catch (err: any) {
    return NextResponse.json(
      { jsonrpc: "2.0", error: { code: -32603, message: err.message || "Internal error" } },
      { headers: corsHeaders, status: 500 }
    );
  }
}

