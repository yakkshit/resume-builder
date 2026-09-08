import { NextRequest, NextResponse } from "next/server";
import { GitHubSyncService, GitHubSyncConfig } from "@/lib/github/sync";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, config, sessionId, title, messages, resumeData, passphrase, slug } = body;

    if (!config || !config.token || !config.owner || !config.repo) {
      return NextResponse.json({ error: "Missing GitHub configuration" }, { status: 400 });
    }

    const ghConfig: GitHubSyncConfig = {
      token: config.token.trim(),
      owner: config.owner.trim(),
      repo: config.repo.trim(),
      branch: config.branch || "main",
    };

    switch (action) {
      case "test": {
        const result = await GitHubSyncService.testConnection(ghConfig);
        return NextResponse.json(result);
      }

      case "sync-chat": {
        if (!sessionId) {
          return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
        }
        const result = await GitHubSyncService.syncEncryptedChatSession(
          ghConfig,
          sessionId,
          title || "Chat Session",
          messages || [],
          passphrase
        );
        return NextResponse.json(result);
      }

      case "fetch-chats": {
        const chats = await GitHubSyncService.fetchAllEncryptedChatSessions(ghConfig, passphrase);
        return NextResponse.json({ chats });
      }

      case "sync-resume": {
        if (!resumeData) {
          return NextResponse.json({ error: "Missing resumeData" }, { status: 400 });
        }
        const result = await GitHubSyncService.syncEncryptedResume(
          ghConfig,
          title || "Resume",
          resumeData,
          passphrase
        );
        return NextResponse.json(result);
      }

      case "fetch-resume": {
        const resume = await GitHubSyncService.fetchEncryptedResume(ghConfig, slug || "resume", passphrase);
        return NextResponse.json({ resume });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error occurred" },
      { status: 500 }
    );
  }
}
