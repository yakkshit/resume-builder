import { NextRequest, NextResponse } from "next/server";
import {
  getUserMemoryVaultContent,
  saveUserMemoryVaultContent,
  invalidateMemoryVaultCache,
} from "@/lib/mcp/mcp-tools-catalog";
import { logMcpExecution } from "@/lib/firebase/mcp-storage";

export const runtime = "nodejs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-user-id, x-mcp-slug",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || searchParams.get("slug") || "default-user";
    const forceRefresh = searchParams.get("forceRefresh") === "true";

    const vault = await getUserMemoryVaultContent(userId, forceRefresh);
    return NextResponse.json(
      {
        ok: true,
        userId,
        vaultMarkdown: vault.content,
        vaultLength: vault.content.length,
        lastUpdated: vault.lastUpdated,
        version: vault.version,
        source: vault.source,
      },
      { headers: corsHeaders }
    );
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || "Failed to retrieve memory vault" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json().catch(() => ({}));
    const { userId = "default-user", ragKnowledgeBase, content, expectedVersion } = body;
    const vaultText = ragKnowledgeBase ?? content;

    if (typeof vaultText !== "string") {
      return NextResponse.json(
        { ok: false, error: "Missing or invalid 'ragKnowledgeBase' or 'content' in payload" },
        { status: 400, headers: corsHeaders }
      );
    }

    // 1. Write-through to unified storage with CAS / optimistic concurrency (T2 / R2)
    const targetVersion = expectedVersion !== undefined ? Number(expectedVersion) : undefined;
    const saveRes = await saveUserMemoryVaultContent(userId, vaultText, targetVersion);

    // 2. Invalidate MCP tool cache to guarantee freshness across all MCP clients
    invalidateMemoryVaultCache(userId);

    const timestamp = saveRes.lastUpdated;
    const version = saveRes.version;

    // 3. Log to audit trail
    await logMcpExecution({
      userId,
      tool: "sync_memory_vault",
      protocol: "rest",
      authType: "session",
      status: "success",
      durationMs: Date.now() - startTime,
      tokensUsed: Math.floor(vaultText.length / 4),
      inputSummary: `Sync ${vaultText.length} chars to Memory Vault (v${version})`,
    }).catch(() => {});

    return NextResponse.json(
      {
        ok: true,
        userId,
        timestamp,
        version,
        vaultLength: vaultText.length,
        message: "Memory Vault successfully synced and cache invalidated across all MCP endpoints.",
      },
      { headers: corsHeaders }
    );
  } catch (err: any) {
    if (err?.code === "VERSION_CONFLICT") {
      return NextResponse.json(
        {
          ok: false,
          error: "VERSION_CONFLICT",
          message: "Concurrent modification detected. The Memory Vault was modified by another session or client.",
          currentVersion: err.currentVersion,
          expectedVersion: err.expectedVersion,
        },
        { status: 409, headers: corsHeaders }
      );
    }

    if (err?.code === "PAYLOAD_TOO_LARGE") {
      return NextResponse.json(
        {
          ok: false,
          error: "PAYLOAD_TOO_LARGE",
          message: err.message,
        },
        { status: 413, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { ok: false, error: err.message || "Failed to sync memory vault" },
      { status: 500, headers: corsHeaders }
    );
  }
}
