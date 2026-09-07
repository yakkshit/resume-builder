import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, customModels } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ isAuthenticated: false, user: null });
    }

    const email = clerkUser.emailAddresses?.[0]?.emailAddress || "";
    const name = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || clerkUser.username || "User";
    const avatarUrl = clerkUser.imageUrl || "";

    // Query or create user in database
    let existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkUser.id))
      .limit(1);

    let userRecord = existingUsers[0];

    if (!userRecord) {
      try {
        const inserted = await db
          .insert(users)
          .values({
            clerkId: clerkUser.id,
            email,
            name,
            avatarUrl,
          })
          .onConflictDoUpdate({
            target: users.clerkId,
            set: {
              email,
              name,
              avatarUrl,
              updatedAt: new Date(),
            },
          })
          .returning();
        userRecord = inserted[0];
      } catch {
        // Safe fallback in case of concurrent insert
        const fallback = await db
          .select()
          .from(users)
          .where(eq(users.clerkId, clerkUser.id))
          .limit(1);
        userRecord = fallback[0];
      }
    }

    if (!userRecord) {
      return NextResponse.json({ isAuthenticated: false, user: null });
    }

    // Fetch user's custom models/keys
    const models = await db
      .select()
      .from(customModels)
      .where(eq(customModels.userId, userRecord.id));

    return NextResponse.json({
      isAuthenticated: true,
      user: {
        id: userRecord.id,
        clerkId: userRecord.clerkId,
        email: userRecord.email,
        name: userRecord.name || name,
        avatarUrl: userRecord.avatarUrl || avatarUrl,
        githubUsername: userRecord.githubUsername,
        githubRepo: userRecord.githubRepo,
        hasGithubToken: Boolean(userRecord.githubToken),
        bio: userRecord.bio,
        createdAt: userRecord.createdAt,
      },
      customModels: models,
    });
  } catch (error) {
    console.error("[User Profile API Error]:", error);
    return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, avatarUrl, githubUsername, githubRepo, githubToken, bio } = body;
    const email = clerkUser.emailAddresses?.[0]?.emailAddress || "";
    const defaultName = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "User";

    const updateSet: Record<string, any> = { updatedAt: new Date() };
    if (name !== undefined) updateSet.name = name;
    if (avatarUrl !== undefined) updateSet.avatarUrl = avatarUrl;
    if (githubUsername !== undefined) updateSet.githubUsername = githubUsername;
    if (githubRepo !== undefined) updateSet.githubRepo = githubRepo;
    if (githubToken !== undefined) updateSet.githubToken = githubToken;
    if (bio !== undefined) updateSet.bio = bio;

    const upserted = await db
      .insert(users)
      .values({
        clerkId: clerkUser.id,
        email,
        name: name || defaultName,
        avatarUrl: avatarUrl || clerkUser.imageUrl,
        githubUsername,
        githubRepo,
        githubToken,
        bio,
      })
      .onConflictDoUpdate({
        target: users.clerkId,
        set: updateSet,
      })
      .returning();

    const userRecord = upserted[0];

    return NextResponse.json({
      success: true,
      user: {
        id: userRecord.id,
        email: userRecord.email,
        name: userRecord.name,
        avatarUrl: userRecord.avatarUrl,
        githubUsername: userRecord.githubUsername,
        githubRepo: userRecord.githubRepo,
        hasGithubToken: Boolean(userRecord.githubToken),
        bio: userRecord.bio,
      },
    });
  } catch (error) {
    console.error("[User Profile Update Error]:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
