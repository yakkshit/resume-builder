import { describe, it, expect, vi } from "vitest";
import { GitHubSyncService, type GitHubSyncConfig } from "@/lib/github/sync";
import { encryptPayload } from "@/lib/crypto/encryption";

describe("GitHubSyncService (Encrypted Zero-Knowledge Sync)", () => {
  const config: GitHubSyncConfig = {
    token: "mock-token-123",
    owner: "octocat",
    repo: "career-vault",
    branch: "main",
  };

  it("encrypts chat session payload and commits to GitHub", async () => {
    const fetchMock = vi.fn();
    // 1. check repo -> 200
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ id: 123 }),
    });
    // 2. get file (check existing) -> 404
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ message: "Not Found" }),
    });
    // 3. put commit -> 201
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({
        content: { sha: "enc_sha_456" },
        commit: { html_url: "https://github.com/octocat/career-vault/commit/enc_sha_456" },
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const messages = [
      { role: "user", content: "Can you optimize my resume?" },
      { role: "assistant", content: "Certainly! Here is the revised resume." },
    ];

    const result = await GitHubSyncService.syncEncryptedChatSession(
      config,
      "session-abc",
      "Resume Optimization",
      messages,
      "secret-passphrase-99"
    );

    expect(result.success).toBe(true);
    expect(result.sha).toBe("enc_sha_456");

    // Verify commit payload contains encrypted JSON envelope
    const putCall = fetchMock.mock.calls[2];
    const body = JSON.parse(putCall[1].body);
    expect(body.message).toContain("sync(encrypted-chat)");
    // Decode base64 content
    const decodedRaw = Buffer.from(body.content, "base64").toString("utf-8");
    const parsedEnvelope = JSON.parse(decodedRaw);
    expect(parsedEnvelope.version).toBe(1);
    expect(parsedEnvelope.ciphertext).toBeDefined();
    expect(parsedEnvelope.salt).toBeDefined();
    expect(parsedEnvelope.iv).toBeDefined();
    // Verify plaintext messages are NOT present in the ciphertext envelope
    expect(decodedRaw).not.toContain("Can you optimize my resume?");

    vi.unstubAllGlobals();
  });

  it("fetches and decrypts an encrypted chat session from GitHub", async () => {
    const passphrase = "my-secure-key-123";
    const originalPayload = {
      id: "session-xyz",
      title: "Full Stack Interview Prep",
      messages: [{ role: "user", content: "Tell me about distributed caching." }],
    };

    const encryptedEnvelope = await encryptPayload(originalPayload, passphrase);
    const base64EncodedForGithub = Buffer.from(encryptedEnvelope, "utf-8").toString("base64");

    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        name: "session-xyz.json",
        content: base64EncodedForGithub,
        sha: "file_sha_789",
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const decrypted = await GitHubSyncService.fetchEncryptedChatSession(
      config,
      "session-xyz",
      passphrase
    );

    expect(decrypted).not.toBeNull();
    expect(decrypted.id).toBe("session-xyz");
    expect(decrypted.title).toBe("Full Stack Interview Prep");
    expect(decrypted.messages[0].content).toBe("Tell me about distributed caching.");

    vi.unstubAllGlobals();
  });

  it("encrypts and decrypts a resume cleanly with GitHubSyncService", async () => {
    const passphrase = "resume-passphrase-vault";
    const resumeData = {
      basicInfo: { name: "Alice Smith", title: "Principal Architect" },
      skills: { Core: ["TypeScript", "Distributed Systems"] },
    };

    const encrypted = await encryptPayload(resumeData, passphrase);
    const base64Content = Buffer.from(encrypted, "utf-8").toString("base64");

    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        name: "alice-smith-resume.json",
        content: base64Content,
        sha: "resume_sha_123",
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await GitHubSyncService.fetchEncryptedResume(
      config,
      "alice-smith-resume",
      passphrase
    );

    expect(result).not.toBeNull();
    expect((result as any).basicInfo.name).toBe("Alice Smith");
    expect((result as any).basicInfo.title).toBe("Principal Architect");

    vi.unstubAllGlobals();
  });
});
