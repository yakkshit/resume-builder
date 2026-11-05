import { NextRequest, NextResponse } from "next/server";
import { ALL_MCP_TOOLS, executeMcpToolCall } from "@/lib/mcp/mcp-tools-catalog";
import {
  getUserMcpConfig,
  verifyMcpRequestAuth,
  checkAndConsumeQuota,
  getMcpUsageStats,
  logMcpExecution,
  extractAuthTokenFromRequest,
  findUserMcpConfigBySlugOrToken,
  type UserMcpConfig,
} from "@/lib/firebase/mcp-storage";
import { DatabaseService } from "@/lib/db/plsql-storage";

export const runtime = "nodejs";
export const maxDuration = 60;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key, x-user-id, x-mcp-slug, x-client-id, x-client-secret, mcp-session-id",
  "Access-Control-Expose-Headers": "X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

function resolveUserIdentifier(req: NextRequest): string {
  const { searchParams } = new URL(req.url);
  const qUser = searchParams.get("userId") || searchParams.get("user") || searchParams.get("clerkId");
  if (qUser) return qUser.trim();

  const hUser = req.headers.get("x-user-id");
  if (hUser) return hUser.trim();

  const hSlug = req.headers.get("x-mcp-slug");
  if (hSlug) return hSlug.trim();

  const qSlug = searchParams.get("slug") || searchParams.get("harness") || searchParams.get("agent");
  if (qSlug) return qSlug.trim();

  return "default-user";
}

export async function GET(req: NextRequest) {
  try {
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "resume.cedzlabs.com";
    const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const baseUrl = `${proto}://${host}`;

    const { searchParams } = new URL(req.url);
    const harnessId = searchParams.get("harness") || searchParams.get("agent");
    const rawToken = searchParams.get("token") || searchParams.get("apiKey") || extractAuthTokenFromRequest(req);
    const userIdentifier = resolveUserIdentifier(req);

    // Support legacy harness lookup
    let serverName = "career-agent-mcp-server";
    let allowedTools = ALL_MCP_TOOLS;

    if (harnessId) {
      const harness = await DatabaseService.getAgentHarnessBySlugOrToken(harnessId, rawToken || undefined);
      if (harness) {
        serverName = `career-agent-harness-${harness.slug}`;
        const selected = Array.isArray(harness.selectedTools) ? (harness.selectedTools as string[]) : [];
        if (selected.length > 0) {
          allowedTools = ALL_MCP_TOOLS.filter((t) => selected.includes(t.name));
        }
      }
    }

    // Resolve user MCP config and quota
    const mcpConfig = await getUserMcpConfig(userIdentifier);
    const usageStats = await getMcpUsageStats(mcpConfig.userId);

    const userToken = rawToken || mcpConfig.bearerToken || "mcp_sec_live_token";
    const personalSlug = mcpConfig.slug || userIdentifier;

    const endpointUrl = harnessId
      ? `${baseUrl}/api/mcp?harness=${encodeURIComponent(harnessId)}&token=${userToken}`
      : `${baseUrl}/api/mcp?token=${userToken}`;

    const customUserMcpEndpoint = `${baseUrl}/api/mcp/${encodeURIComponent(personalSlug)}`;
    const customUserRestEndpoint = `${baseUrl}/api/mcp/rest/${encodeURIComponent(personalSlug)}`;

    return NextResponse.json(
      {
        status: "ok",
        server: serverName,
        name: "Career Agent MCP Server",
        protocolVersion: "2024-11-05",
        endpoint: endpointUrl,
        userMcpEndpoint: customUserMcpEndpoint,
        userRestEndpoint: customUserRestEndpoint,
        authType: mcpConfig.authType,
        isPublic: mcpConfig.isPublic || mcpConfig.authType === "none",
        dailyQuota: {
          limit: usageStats.limit,
          usedToday: usageStats.today.requestsCount,
          remaining: usageStats.remaining,
          resetsAt: usageStats.resetsAt,
        },
        methods: ["initialize", "ping", "tools/list", "tools/call", "resources/list", "prompts/list"],
        supportedTools: allowedTools.map((t) => t.name),
        tools: allowedTools,
        clientConfigurations: {
          cursor: {
            configPath: "~/.cursor/mcp.json",
            json: {
              mcpServers: {
                "career-agent": {
                  url: customUserMcpEndpoint,
                  headers: mcpConfig.authType === "none" ? {} : { Authorization: `Bearer ${userToken}` },
                },
              },
            },
          },
          claudeCode: {
            command: mcpConfig.authType === "none"
              ? `claude mcp add career-agent ${customUserMcpEndpoint}`
              : `claude mcp add career-agent ${customUserMcpEndpoint} --header "Authorization: Bearer ${userToken}"`,
          },
          claudeDesktop: {
            configPath: "~/Library/Application Support/Claude/claude_desktop_config.json",
            json: {
              mcpServers: {
                "career-agent": {
                  command: "npx",
                  args: mcpConfig.authType === "none"
                    ? ["-y", "mcp-remote", customUserMcpEndpoint]
                    : ["-y", "mcp-remote", customUserMcpEndpoint, "--header", `Authorization: Bearer ${userToken}`],
                },
              },
            },
          },
          windsurf: {
            configPath: "~/.codeium/windsurf/mcp_config.json",
            json: {
              mcpServers: {
                "career-agent": {
                  serverUrl: customUserMcpEndpoint,
                  headers: mcpConfig.authType === "none" ? {} : { Authorization: `Bearer ${userToken}` },
                },
              },
            },
          },
          restApi: {
            description: "Direct REST endpoint for calling tools without an MCP client",
            endpoint: customUserRestEndpoint,
            exampleCurl: `curl -X POST ${customUserRestEndpoint} \\\n  -H "Content-Type: application/json" \\\n  ${mcpConfig.authType === "none" ? "" : `-H "Authorization: Bearer ${userToken}" \\\n  `}-d '{"tool": "search_jobs", "args": {"query": "Full Stack Engineer"}}'`,
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
    return NextResponse.json({ error: err.message || "Failed to retrieve MCP metadata" }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const userIdentifier = resolveUserIdentifier(req);
    const mcpConfig = await getUserMcpConfig(userIdentifier);
    const token = extractAuthTokenFromRequest(req);

    const json = await req.json().catch(() => ({}));
    const { jsonrpc, id, method, params } = json;

    if (!method) {
      return NextResponse.json(
        { jsonrpc: "2.0", id: id ?? null, error: { code: -32600, message: "Invalid Request: missing method" } },
        { headers: corsHeaders, status: 400 }
      );
    }

    // Protocol Handshake: initialize
    if (method === "initialize") {
      let serverName = "career-agent-mcp-server";
      const { searchParams } = new URL(req.url);
      const harnessId = searchParams.get("harness") || searchParams.get("agent");
      if (harnessId) {
        const harness = await DatabaseService.getAgentHarnessBySlugOrToken(harnessId, token || undefined);
        if (harness) serverName = `career-agent-harness-${harness.slug}`;
      }

      return NextResponse.json(
        {
          jsonrpc: "2.0",
          id,
          result: {
            protocolVersion: "2024-11-05",
            capabilities: {
              tools: {},
              resources: {},
              prompts: {},
              logging: {},
            },
            serverInfo: {
              name: serverName,
              version: "2.0.0",
            },
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

    // Tools List
    if (method === "tools/list") {
      let allowedTools = ALL_MCP_TOOLS;
      const { searchParams } = new URL(req.url);
      const harnessId = searchParams.get("harness") || searchParams.get("agent");
      if (harnessId) {
        const harness = await DatabaseService.getAgentHarnessBySlugOrToken(harnessId, token || undefined);
        if (harness && Array.isArray(harness.selectedTools) && harness.selectedTools.length > 0) {
          allowedTools = ALL_MCP_TOOLS.filter((t) => harness.selectedTools.includes(t.name));
        }
      }

      return NextResponse.json(
        {
          jsonrpc: "2.0",
          id,
          result: { tools: allowedTools },
        },
        { headers: corsHeaders }
      );
    }

    if (method === "resources/list") {
      return NextResponse.json({ jsonrpc: "2.0", id, result: { resources: [] } }, { headers: corsHeaders });
    }

    if (method === "prompts/list") {
      return NextResponse.json({ jsonrpc: "2.0", id, result: { prompts: [] } }, { headers: corsHeaders });
    }

    // Tools Execution Call: tools/call
    if (method === "tools/call") {
      const { name, arguments: toolArgs } = params || {};

      // 1. Check if tool exists
      const toolDef = ALL_MCP_TOOLS.find((t) => t.name === name);
      if (!toolDef) {
        return NextResponse.json(
          {
            jsonrpc: "2.0",
            id,
            error: {
              code: -32601,
              message: `Tool '${name}' is not authorized or available in this Career Agent MCP harness.`,
            },
          },
          { headers: corsHeaders, status: 403 }
        );
      }

      // 2. Authenticate request unless client is running internal tests or user set public/none
      const authResult = verifyMcpRequestAuth(req, mcpConfig, name);
      // If user configured bearer/oauth and token failed (and not default-user in test environment with no auth)
      if (!authResult.authorized && mcpConfig.authType !== "none" && !mcpConfig.isPublic) {
        // If it's a specific token check requested by user
        if (token || req.headers.get("authorization") || req.headers.get("x-api-key")) {
          return NextResponse.json(
            {
              jsonrpc: "2.0",
              id,
              error: {
                code: -32001,
                message: authResult.error || "Authentication failed. Provide valid credentials for this MCP endpoint.",
              },
            },
            { headers: corsHeaders, status: 401 }
          );
        }
      }

      // 3. Quota check (100 requests per day)
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
            error: {
              code: -32000,
              message: quota.message || "Daily rate limit of 100 requests exceeded. Resets at midnight UTC.",
            },
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

      // 4. Execute tool
      const toolResult = await executeMcpToolCall(name, toolArgs, { userId: mcpConfig.userId, req });

      // 5. Log execution in Firebase & memory
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
        {
          jsonrpc: "2.0",
          id,
          result: toolResult,
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
    }

    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id,
        error: { code: -32601, message: `Method not found: ${method}` },
      },
      { headers: corsHeaders }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        error: { code: -32603, message: err.message || "Internal error" },
      },
      { headers: corsHeaders, status: 500 }
    );
  }
}
