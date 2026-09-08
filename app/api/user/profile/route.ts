import { NextRequest, NextResponse } from "next/server";
import { DatabaseService } from "@/lib/db/plsql-storage";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clerkId = searchParams.get("clerkId") || searchParams.get("userId");

    if (!clerkId) {
      return NextResponse.json({ error: "Missing clerkId or userId" }, { status: 400 });
    }

    const user = await DatabaseService.getUserProfile(clerkId);
    if (!user) {
      return NextResponse.json({ exists: false, user: null });
    }

    // Return profile (redact sensitive internal DB fields if needed, return keys & settings)
    return NextResponse.json({
      exists: true,
      user: {
        id: user.id,
        clerkId: user.clerkId,
        name: user.name,
        email: user.email,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        isOnboarded: user.isOnboarded,
        isIncognito: user.isIncognito,
        githubUsername: user.githubUsername,
        githubRepo: user.githubRepo,
        githubSyncEnabled: user.githubSyncEnabled,
        apiKeys: user.apiKeys,
        preferences: user.preferences,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("GET /api/user/profile error:", error);
    return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clerkId, name, email, bio, isOnboarded, isIncognito, apiKeys, githubUsername, githubRepo, githubToken, githubSyncEnabled, preferences } = body;

    if (!clerkId) {
      return NextResponse.json({ error: "Missing required clerkId" }, { status: 400 });
    }

    const result = await DatabaseService.saveUserOnboarding({
      clerkId,
      name,
      email,
      bio,
      isOnboarded: isOnboarded ?? true,
      isIncognito: isIncognito ?? false,
      apiKeys: apiKeys ?? {},
      githubUsername,
      githubRepo,
      githubToken,
      githubSyncEnabled: githubSyncEnabled ?? Boolean(githubToken && githubRepo),
      preferences: preferences ?? {},
    });

    if (!result.success) {
      return NextResponse.json({ error: "Failed to persist onboarding data" }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: result.user });
  } catch (error) {
    console.error("POST /api/user/profile error:", error);
    return NextResponse.json({ error: "Failed to save user profile" }, { status: 500 });
  }
}
