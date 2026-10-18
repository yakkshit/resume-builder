import { NextResponse } from "next/server";
import { DatabaseService } from "@/lib/db/plsql-storage";

function getUserId(req?: Request): string {
  if (req) {
    const headerId = req.headers.get("x-user-id");
    if (headerId) return headerId;
    try {
      const url = new URL(req.url);
      const queryId = url.searchParams.get("userId") || url.searchParams.get("clerkId");
      if (queryId) return queryId;
    } catch {}
  }
  return "default-user";
}

export async function GET(req: Request) {
  try {
    const userId = getUserId(req);
    const models = await DatabaseService.getUserCustomModels(userId);

    // Mask API keys for security in client view
    const sanitized = models.map((m) => ({
      id: m.id,
      name: m.name,
      provider: m.provider,
      modelName: m.modelName,
      endpointUrl: m.endpointUrl,
      isActive: m.isActive,
      hasKey: Boolean(m.apiKey),
      maskedKey: m.apiKey ? `${m.apiKey.slice(0, 4)}...${m.apiKey.slice(-4)}` : null,
      createdAt: m.createdAt,
    }));

    return NextResponse.json({ models: sanitized });
  } catch (error) {
    console.error("[User Keys GET Error]:", error);
    return NextResponse.json({ error: "Failed to fetch keys" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userId = body.userId || body.clerkId || req.headers.get("x-user-id") || "default-user";
    const { name, provider, apiKey, endpointUrl, modelName, isActive = true } = body;

    if (!provider || !modelName) {
      return NextResponse.json({ error: "Provider and modelName are required" }, { status: 400 });
    }

    const saved = await DatabaseService.saveCustomModel({
      userId,
      name: name || `${provider} (${modelName})`,
      provider,
      apiKey,
      endpointUrl,
      modelName,
      isActive,
    });

    return NextResponse.json({
      success: true,
      model: {
        id: saved.id,
        provider: saved.provider,
        name: saved.name,
        modelName: saved.modelName,
        isActive: saved.isActive,
      },
    });
  } catch (error) {
    console.error("[User Keys POST Error]:", error);
    return NextResponse.json({ error: "Failed to save key" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const userId = getUserId(req);
    const { searchParams } = new URL(req.url);
    const modelId = searchParams.get("id");
    const provider = searchParams.get("provider");

    if (modelId) {
      await DatabaseService.deleteCustomModel(userId, modelId);
    } else if (provider) {
      await DatabaseService.deleteCustomModel(userId, provider);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[User Keys DELETE Error]:", error);
    return NextResponse.json({ error: "Failed to delete key" }, { status: 500 });
  }
}
