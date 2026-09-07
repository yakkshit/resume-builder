import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, customModels } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRecord = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkUser.id))
      .limit(1);

    if (userRecord.length === 0) {
      return NextResponse.json({ models: [] });
    }

    const models = await db
      .select()
      .from(customModels)
      .where(eq(customModels.userId, userRecord[0].id));

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
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get or create user record
    let userRecord = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkUser.id))
      .limit(1);

    if (userRecord.length === 0) {
      try {
        const inserted = await db
          .insert(users)
          .values({
            clerkId: clerkUser.id,
            email: clerkUser.emailAddresses?.[0]?.emailAddress,
            name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
          })
          .onConflictDoUpdate({
            target: users.clerkId,
            set: { updatedAt: new Date() },
          })
          .returning();
        userRecord = inserted;
      } catch {
        userRecord = await db
          .select()
          .from(users)
          .where(eq(users.clerkId, clerkUser.id))
          .limit(1);
      }
    }

    const body = await req.json();
    const { name, provider, apiKey, endpointUrl, modelName, isActive = true } = body;

    if (!provider || !modelName) {
      return NextResponse.json({ error: "Provider and modelName are required" }, { status: 400 });
    }

    // Upsert key for provider
    const existing = await db
      .select()
      .from(customModels)
      .where(and(eq(customModels.userId, userRecord[0].id), eq(customModels.provider, provider)))
      .limit(1);

    let result;
    if (existing.length > 0) {
      result = await db
        .update(customModels)
        .set({
          name: name || `${provider} (${modelName})`,
          apiKey: apiKey || existing[0].apiKey,
          endpointUrl: endpointUrl || existing[0].endpointUrl,
          modelName,
          isActive,
          updatedAt: new Date(),
        })
        .where(eq(customModels.id, existing[0].id))
        .returning();
    } else {
      result = await db
        .insert(customModels)
        .values({
          userId: userRecord[0].id,
          name: name || `${provider} (${modelName})`,
          provider,
          apiKey,
          endpointUrl,
          modelName,
          isActive,
        })
        .returning();
    }

    return NextResponse.json({
      success: true,
      model: {
        id: result[0].id,
        provider: result[0].provider,
        name: result[0].name,
        modelName: result[0].modelName,
        isActive: result[0].isActive,
      },
    });
  } catch (error) {
    console.error("[User Keys POST Error]:", error);
    return NextResponse.json({ error: "Failed to save key" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const modelId = searchParams.get("id");
    const provider = searchParams.get("provider");

    const userRecord = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkUser.id))
      .limit(1);

    if (userRecord.length === 0) {
      return NextResponse.json({ success: true });
    }

    if (modelId) {
      await db
        .delete(customModels)
        .where(and(eq(customModels.id, modelId), eq(customModels.userId, userRecord[0].id)));
    } else if (provider) {
      await db
        .delete(customModels)
        .where(and(eq(customModels.provider, provider), eq(customModels.userId, userRecord[0].id)));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[User Keys DELETE Error]:", error);
    return NextResponse.json({ error: "Failed to delete key" }, { status: 500 });
  }
}
