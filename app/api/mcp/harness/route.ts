import { NextRequest, NextResponse } from "next/server";
import { DatabaseService } from "@/lib/db/plsql-storage";
import crypto from "node:crypto";

export const runtime = "nodejs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || undefined;
    const slug = searchParams.get("slug") || searchParams.get("id");

    if (slug) {
      const harness = await DatabaseService.getAgentHarnessBySlugOrToken(slug);
      if (!harness) {
        return NextResponse.json({ error: "Harness not found" }, { status: 404, headers: corsHeaders });
      }
      return NextResponse.json({ harness }, { headers: corsHeaders });
    }

    const harnesses = await DatabaseService.getUserAgentHarnesses(userId);
    return NextResponse.json({ harnesses }, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch harnesses" }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      userId,
      name,
      description,
      slug: rawSlug,
      authToken: customToken,
      systemPrompt,
      selectedTools,
      customInstructions,
      isPublic,
    } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required for agent harness" }, { status: 400, headers: corsHeaders });
    }

    const slug = rawSlug
      ? rawSlug.toLowerCase().replace(/[^a-z0-9_-]/g, "-")
      : name.toLowerCase().replace(/[^a-z0-9_-]/g, "-") + "-" + crypto.randomBytes(3).toString("hex");

    const authToken = customToken || `mcp_harness_${crypto.randomBytes(12).toString("hex")}`;

    const res = await DatabaseService.saveAgentHarness({
      id,
      userId,
      name,
      description: description || `Custom Agentic Harness: ${name}`,
      slug,
      authToken,
      systemPrompt,
      selectedTools: Array.isArray(selectedTools) ? selectedTools : [],
      customInstructions,
      isPublic: Boolean(isPublic),
    });

    if (!res.success) {
      return NextResponse.json({ error: "Failed to persist harness to database" }, { status: 500, headers: corsHeaders });
    }

    const host = req.headers.get("host") || "localhost:3000";
    const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const baseUrl = `${proto}://${host}`;

    const shareableUrl = `${baseUrl}/api/mcp?harness=${slug}&token=${authToken}`;

    return NextResponse.json(
      {
        success: true,
        harness: res.harness,
        shareableUrl,
        clientConfigurations: {
          cursor: {
            mcpServers: {
              [slug]: {
                url: `${baseUrl}/api/mcp?harness=${slug}`,
                headers: {
                  Authorization: `Bearer ${authToken}`,
                },
              },
            },
          },
          claudeCode: `claude mcp add ${slug} ${baseUrl}/api/mcp?harness=${slug} --header "Authorization: Bearer ${authToken}"`,
          claudeDesktop: {
            mcpServers: {
              [slug]: {
                command: "npx",
                args: ["-y", "mcp-remote", `${baseUrl}/api/mcp?harness=${slug}`, "--header", `Authorization: Bearer ${authToken}`],
              },
            },
          },
        },
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create agent harness" }, { status: 500, headers: corsHeaders });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id") || searchParams.get("slug");
    if (!id) {
      return NextResponse.json({ error: "Harness ID or slug required" }, { status: 400, headers: corsHeaders });
    }

    const success = await DatabaseService.deleteAgentHarness(id);
    return NextResponse.json({ success }, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete agent harness" }, { status: 500, headers: corsHeaders });
  }
}
