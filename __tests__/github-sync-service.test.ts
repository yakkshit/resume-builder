import { describe, it, expect, vi } from "vitest";
import { GitHubSyncService, type GitHubSyncConfig } from "@/lib/github/sync";

describe("GitHubSyncService (Private Cloud Backup)", () => {
  it("rejects configuration with missing required credentials", async () => {
    const invalidConfig: GitHubSyncConfig = {
      token: "",
      owner: "",
      repo: "career-agent-backup",
    };

    const res = await GitHubSyncService.ensureRepositoryExists(invalidConfig);
    expect(res.success).toBe(false);
    expect(res.message).toBe("Missing GitHub credentials");
  });

  it("attempts to create private repository when repository returns 404", async () => {
    const fetchMock = vi.fn();
    // First call: check repository -> 404
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ message: "Not Found" }),
    });

    // Second call: create repository -> 201 Created
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ full_name: "testuser/career-agent-backup", private: true }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const config: GitHubSyncConfig = {
      token: "mock-auth",
      owner: "testuser",
      repo: "career-agent-backup",
    };

    const res = await GitHubSyncService.ensureRepositoryExists(config);
    expect(res.success).toBe(true);

    // Verify the create API call payload specifies private: true
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const createCallArgs = fetchMock.mock.calls[1];
    expect(createCallArgs[0]).toBe("https://api.github.com/user/repos");
    const parsedBody = JSON.parse(createCallArgs[1].body);
    expect(parsedBody.private).toBe(true);
    expect(parsedBody.auto_init).toBe(true);
    expect(parsedBody.name).toBe("career-agent-backup");

    vi.unstubAllGlobals();
  });

  it("handles pushFile successfully when repository already exists", async () => {
    const fetchMock = vi.fn();
    // 1. check repo -> 200
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ id: 123 }),
    });
    // 2. get file (check existing sha) -> 404 (new file)
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ message: "Not Found" }),
    });
    // 3. put file commit -> 201
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({
        content: { sha: "abc123sha" },
        commit: { html_url: "https://github.com/testuser/career-agent-backup/commit/abc123sha" },
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const config: GitHubSyncConfig = {
      token: "mock-auth",
      owner: "testuser",
      repo: "career-agent-backup",
    };

    const result = await GitHubSyncService.commitFile(
      config,
      "resumes/resume.json",
      JSON.stringify({ name: "Alex" }, null, 2),
      "Backup latest resume"
    );

    expect(result.success).toBe(true);
    expect(result.sha).toBe("abc123sha");
    expect(result.commitUrl).toContain("abc123sha");

    vi.unstubAllGlobals();
  });
});
