/**
 * GitHub Zero-Knowledge & Free Storage Sync Engine
 * Allows users to link their GitHub account/token to automatically push and pull:
 * - Structured Resumes (resume.json, resume.md)
 * - Cover Letters (cover-letter.md)
 * - Chat Sessions & History (chats/chat-{id}.md)
 */

export interface GitHubSyncConfig {
  token: string;
  owner: string;
  repo: string;
  branch?: string;
}

export interface GitHubFileCommitResult {
  success: boolean;
  sha?: string;
  commitUrl?: string;
  error?: string;
}

/**
 * Universal UTF-8 Base64 encoder that works in both Node.js and Browser runtimes.
 */
function utf8ToBase64(str: string): string {
  if (typeof window === "undefined" && typeof Buffer !== "undefined") {
    return Buffer.from(str, "utf-8").toString("base64");
  }
  // Browser environment UTF-8 safe encoding
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export class GitHubSyncService {
  /**
   * Automatically ensure that the private repository exists, creating it if missing.
   */
  static async ensureRepositoryExists(config: GitHubSyncConfig): Promise<{ success: boolean; message?: string }> {
    const { token, owner, repo } = config;
    if (!token || !owner || !repo) {
      return { success: false, message: "Missing GitHub credentials" };
    }

    try {
      const checkRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: {
          Authorization: `token ${token.trim()}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "CareerAgent-Sync",
        },
      });

      if (checkRes.ok) {
        return { success: true };
      }

      if (checkRes.status === 404) {
        // Automatically create private repository
        const createRes = await fetch("https://api.github.com/user/repos", {
          method: "POST",
          headers: {
            Authorization: `token ${token.trim()}`,
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
            "User-Agent": "CareerAgent-Sync",
          },
          body: JSON.stringify({
            name: repo.trim(),
            private: true,
            auto_init: true,
            description: "Personal Career Assistant Data Backup (Private)",
          }),
        });

        if (createRes.ok || createRes.status === 201) {
          return { success: true, message: "Created private repository automatically." };
        }

        const errData = await createRes.json();
        return { success: false, message: errData.message || "Unable to auto-create private repository." };
      }

      return { success: false, message: `GitHub status ${checkRes.status}` };
    } catch (e) {
      return { success: false, message: e instanceof Error ? e.message : "Network error" };
    }
  }

  /**
   * Test connection and verify token repository access.
   */
  static async testConnection(config: GitHubSyncConfig): Promise<{ success: boolean; message: string }> {
    const { token, owner, repo } = config;
    if (!token || !owner || !repo) {
      return { success: false, message: "Missing GitHub token, username, or repository name" };
    }

    try {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: {
          Authorization: `token ${token.trim()}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "CareerAgent-Sync",
        },
      });

      if (res.ok) {
        const repoData = await res.json();
        const privacy = repoData.private ? "Private" : "Public";
        return { success: true, message: `Connected to repository (${privacy})` };
      }

      if (res.status === 404) {
        // Attempt auto-creation as private repo
        const autoCreate = await this.ensureRepositoryExists(config);
        if (autoCreate.success) {
          return { success: true, message: "Private repository created and connected successfully!" };
        }
        return {
          success: false,
          message: "Repository not found. Personal Access Token needs 'repo' scope to access/create private repos.",
        };
      }

      if (res.status === 401) {
        return { success: false, message: "Invalid GitHub Personal Access Token." };
      }

      const err = await res.json();
      return { success: false, message: err.message || "Failed to authenticate with GitHub" };
    } catch (e) {
      return { success: false, message: e instanceof Error ? e.message : "Network error" };
    }
  }

  /**
   * Commit or update a file directly in the user's GitHub repository.
   */
  static async commitFile(
    config: GitHubSyncConfig,
    filePath: string,
    content: string,
    commitMessage: string
  ): Promise<GitHubFileCommitResult> {
    const { token, owner, repo, branch = "main" } = config;
    if (!token || !owner || !repo) {
      return { success: false, error: "Missing GitHub configuration (token, owner, or repo)" };
    }

    try {
      // Ensure repo exists first
      await this.ensureRepositoryExists(config);

      const cleanToken = token.trim();
      const baseUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

      // Check if file already exists to obtain its current SHA
      let existingSha: string | undefined;
      const getRes = await fetch(`${baseUrl}?ref=${branch}`, {
        headers: {
          Authorization: `token ${cleanToken}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "CareerAgent-Sync",
        },
      });

      if (getRes.ok) {
        const fileInfo = await getRes.json();
        existingSha = fileInfo.sha;
      }

      const base64Content = utf8ToBase64(content);

      const body: Record<string, unknown> = {
        message: commitMessage,
        content: base64Content,
        branch,
      };
      if (existingSha) {
        body.sha = existingSha;
      }

      const putRes = await fetch(baseUrl, {
        method: "PUT",
        headers: {
          Authorization: `token ${cleanToken}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
          "User-Agent": "CareerAgent-Sync",
        },
        body: JSON.stringify(body),
      });

      if (!putRes.ok) {
        const err = await putRes.json();
        return { success: false, error: err.message || "Failed to commit to GitHub" };
      }

      const resData = await putRes.json();
      return {
        success: true,
        sha: resData.content?.sha,
        commitUrl: resData.commit?.html_url,
      };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : "GitHub sync error" };
    }
  }

  /**
   * Sync a Chat Session to GitHub as a clean Markdown file.
   */
  static async syncChatSession(
    config: GitHubSyncConfig,
    sessionId: string,
    title: string,
    messages: Array<{ role: string; content: string; createdAt?: string }>
  ): Promise<GitHubFileCommitResult> {
    const markdownLines = [
      `# Chat Session: ${title}`,
      `*Session ID: ${sessionId} | Synced: ${new Date().toISOString()}*`,
      "",
      "---",
      "",
    ];

    for (const msg of messages) {
      const sender = msg.role === "user" ? "👤 **User**" : "🤖 **Career Assistant**";
      markdownLines.push(`### ${sender}`);
      markdownLines.push(msg.content);
      markdownLines.push("");
    }

    const filePath = `chats/${sessionId}.md`;
    return this.commitFile(
      config,
      filePath,
      markdownLines.join("\n"),
      `sync(chat): update session ${title.slice(0, 30)}`
    );
  }

  /**
   * Sync a structured Resume to GitHub as JSON and Markdown.
   */
  static async syncResume(
    config: GitHubSyncConfig,
    title: string,
    resumeData: Record<string, unknown>
  ): Promise<GitHubFileCommitResult> {
    const jsonContent = JSON.stringify(resumeData, null, 2);
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "resume";
    const filePath = `resumes/${slug}.json`;

    return this.commitFile(
      config,
      filePath,
      jsonContent,
      `sync(resume): update ${title}`
    );
  }

  /**
   * Pull and list synced chat sessions from the GitHub repository.
   */
  static async listRemoteChats(config: GitHubSyncConfig): Promise<string[]> {
    const { token, owner, repo, branch = "main" } = config;
    try {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/chats?ref=${branch}`, {
        headers: {
          Authorization: `token ${token.trim()}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "CareerAgent-Sync",
        },
      });
      if (!res.ok) return [];
      const items = await res.json();
      if (!Array.isArray(items)) return [];
      return items.map((f: any) => f.name).filter((name: string) => name.endsWith(".md"));
    } catch {
      return [];
    }
  }
}
