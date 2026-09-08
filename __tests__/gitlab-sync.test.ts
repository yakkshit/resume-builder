import { describe, it, expect, vi } from "vitest";
import { GitLabSyncService, type GitLabSyncConfig } from "@/lib/github/sync";

describe("GitLabSyncService (Zero-Knowledge Sync)", () => {
  const config: GitLabSyncConfig = {
    token: "mock-auth",
    projectPath: "octocat/career-vault",
    branch: "main",
  };

  it("fails gracefully when token is missing", async () => {
    const res = await GitLabSyncService.testConnection({ token: "" });
    expect(res.success).toBe(false);
    expect(res.message).toContain("Missing GitLab Personal Access Token");
  });

  it("handles commitFile successfully with mocked GitLab API", async () => {
    const fetchMock = vi.fn();
    // 1. check file -> 404 (new file)
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ message: "404 Not Found" }),
    });
    // 2. post file -> 201 Created
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ file_path: "chats/session-1.json", branch: "main" }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await GitLabSyncService.commitFile(
      config,
      "chats/session-1.json",
      JSON.stringify({ id: "session-1" }),
      "Backup chat"
    );

    expect(result.success).toBe(true);

    vi.unstubAllGlobals();
  });

  it("encrypts and commits a chat session to GitLab", async () => {
    const fetchMock = vi.fn();
    fetchMock.mockResolvedValueOnce({ ok: false, status: 404 });
    fetchMock.mockResolvedValueOnce({ ok: true, status: 201, json: async () => ({}) });

    vi.stubGlobal("fetch", fetchMock);

    const result = await GitLabSyncService.syncEncryptedChatSession(
      config,
      "session-gl-1",
      "GitLab Encrypted Chat",
      [{ role: "user", content: "Help me review my CV" }],
      "passphrase-gitlab-999"
    );

    expect(result.success).toBe(true);

    // Verify commit payload contains encrypted content
    const postCall = fetchMock.mock.calls[1];
    const body = JSON.parse(postCall[1].body);
    const decodedRaw = Buffer.from(body.content, "base64").toString("utf-8");
    const envelope = JSON.parse(decodedRaw);
    expect(envelope.version).toBe(1);
    expect(envelope.ciphertext).toBeDefined();

    vi.unstubAllGlobals();
  });
});
