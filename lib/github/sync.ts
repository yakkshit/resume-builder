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
   * Sync an Encrypted Chat Session to GitHub (AES-256-GCM Zero-Knowledge).
   */
  static async syncEncryptedChatSession(
    config: GitHubSyncConfig,
    sessionId: string,
    title: string,
    messages: Array<{ role: string; content: string; createdAt?: string }>,
    passphrase?: string
  ): Promise<GitHubFileCommitResult> {
    const rawPayload = {
      id: sessionId,
      title,
      messages,
      updatedAt: Date.now(),
    };

    let contentToSave: string;
    if (passphrase && passphrase.trim().length > 0) {
      const { encryptPayload } = await import("@/lib/crypto/encryption");
      contentToSave = await encryptPayload(rawPayload, passphrase);
    } else {
      contentToSave = JSON.stringify(rawPayload, null, 2);
    }

    const filePath = `chats/${sessionId}.json`;
    return this.commitFile(
      config,
      filePath,
      contentToSave,
      `sync(encrypted-chat): update session ${title.slice(0, 30)}`
    );
  }

  /**
   * Fetch a single chat session from GitHub, decrypting it if a passphrase is provided.
   */
  static async fetchEncryptedChatSession(
    config: GitHubSyncConfig,
    fileNameOrId: string,
    passphrase?: string
  ): Promise<any | null> {
    const { token, owner, repo, branch = "main" } = config;
    const fileName = fileNameOrId.endsWith(".json") || fileNameOrId.endsWith(".md")
      ? fileNameOrId
      : `${fileNameOrId}.json`;
    const filePath = `chats/${fileName}`;

    try {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`, {
        headers: {
          Authorization: `token ${token.trim()}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "CareerAgent-Sync",
        },
      });

      if (!res.ok) return null;
      const fileData = await res.json();
      if (!fileData.content) return null;

      // Decode Base64 from GitHub
      const base64Clean = fileData.content.replace(/\s+/g, "");
      let rawText = "";
      if (typeof window === "undefined" && typeof Buffer !== "undefined") {
        rawText = Buffer.from(base64Clean, "base64").toString("utf-8");
      } else {
        const bin = atob(base64Clean);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        rawText = new TextDecoder().decode(bytes);
      }

      // Check if it is encrypted envelope
      if (passphrase && passphrase.trim().length > 0) {
        try {
          const parsed = JSON.parse(rawText);
          if (parsed.version === 1 && parsed.ciphertext && parsed.salt && parsed.iv) {
            const { decryptPayload } = await import("@/lib/crypto/encryption");
            const decrypted = await decryptPayload(rawText, passphrase);
            return JSON.parse(decrypted);
          }
        } catch {
          // If decryption fails or not encrypted envelope, return parsed JSON if possible
        }
      }

      try {
        return JSON.parse(rawText);
      } catch {
        return { content: rawText, id: fileName.replace(/\.[^/.]+$/, "") };
      }
    } catch {
      return null;
    }
  }

  /**
   * Fetch all chat sessions from GitHub repository and decrypt them if encrypted.
   */
  static async fetchAllEncryptedChatSessions(
    config: GitHubSyncConfig,
    passphrase?: string
  ): Promise<any[]> {
    const chatFiles = await this.listRemoteChats(config);
    const sessions: any[] = [];

    for (const file of chatFiles) {
      const session = await this.fetchEncryptedChatSession(config, file, passphrase);
      if (session) {
        sessions.push(session);
      }
    }

    return sessions;
  }

  /**
   * Sync a structured Resume to GitHub with zero-knowledge encryption option.
   */
  static async syncEncryptedResume(
    config: GitHubSyncConfig,
    title: string,
    resumeData: Record<string, unknown>,
    passphrase?: string
  ): Promise<GitHubFileCommitResult> {
    let contentToSave: string;
    if (passphrase && passphrase.trim().length > 0) {
      const { encryptPayload } = await import("@/lib/crypto/encryption");
      contentToSave = await encryptPayload(resumeData, passphrase);
    } else {
      contentToSave = JSON.stringify(resumeData, null, 2);
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "resume";
    const filePath = `resumes/${slug}.json`;

    return this.commitFile(
      config,
      filePath,
      contentToSave,
      `sync(encrypted-resume): update ${title}`
    );
  }

  /**
   * Fetch and decrypt a resume from GitHub repository.
   */
  static async fetchEncryptedResume(
    config: GitHubSyncConfig,
    slug: string,
    passphrase?: string
  ): Promise<Record<string, unknown> | null> {
    const { token, owner, repo, branch = "main" } = config;
    const fileName = slug.endsWith(".json") ? slug : `${slug}.json`;
    const filePath = `resumes/${fileName}`;

    try {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`, {
        headers: {
          Authorization: `token ${token.trim()}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "CareerAgent-Sync",
        },
      });

      if (!res.ok) return null;
      const fileData = await res.json();
      if (!fileData.content) return null;

      const base64Clean = fileData.content.replace(/\s+/g, "");
      let rawText = "";
      if (typeof window === "undefined" && typeof Buffer !== "undefined") {
        rawText = Buffer.from(base64Clean, "base64").toString("utf-8");
      } else {
        const bin = atob(base64Clean);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        rawText = new TextDecoder().decode(bytes);
      }

      if (passphrase && passphrase.trim().length > 0) {
        try {
          const parsed = JSON.parse(rawText);
          if (parsed.version === 1 && parsed.ciphertext && parsed.salt && parsed.iv) {
            const { decryptPayload } = await import("@/lib/crypto/encryption");
            const decrypted = await decryptPayload(rawText, passphrase);
            return JSON.parse(decrypted);
          }
        } catch {
          // Ignore
        }
      }

      return JSON.parse(rawText);
    } catch {
      return null;
    }
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
      return items
        .map((f: any) => f.name)
        .filter((name: string) => name.endsWith(".json") || name.endsWith(".md") || name.endsWith(".enc"));
    } catch {
      return [];
    }
  }
}

export interface GitLabSyncConfig {
  token: string;
  projectId?: string | number;
  projectPath?: string; // e.g. "username/career-assistant-vault"
  baseUrl?: string; // default "https://gitlab.com"
  branch?: string;
}

export class GitLabSyncService {
  private static getApiBase(config: GitLabSyncConfig) {
    const base = config.baseUrl?.replace(/\/+$/, "") || "https://gitlab.com";
    return `${base}/api/v4`;
  }

  static async testConnection(config: GitLabSyncConfig): Promise<{ success: boolean; message: string }> {
    const { token, projectPath, projectId } = config;
    if (!token) return { success: false, message: "Missing GitLab Personal Access Token" };

    const id = projectId || encodeURIComponent(projectPath || "");
    const url = `${this.getApiBase(config)}/projects/${id}`;

    try {
      const res = await fetch(url, {
        headers: {
          "PRIVATE-TOKEN": token.trim(),
          Accept: "application/json",
          "User-Agent": "CareerAgent-GitLabSync",
        },
      });

      if (res.ok) {
        return { success: true, message: "Connected to GitLab repository successfully!" };
      }
      return { success: false, message: `GitLab connection returned status ${res.status}` };
    } catch (e) {
      return { success: false, message: e instanceof Error ? e.message : "GitLab network error" };
    }
  }

  static async commitFile(
    config: GitLabSyncConfig,
    filePath: string,
    content: string,
    commitMessage: string
  ): Promise<GitHubFileCommitResult> {
    const { token, projectPath, projectId, branch = "main" } = config;
    if (!token) return { success: false, error: "Missing GitLab token" };

    const targetId = projectId || encodeURIComponent(projectPath || "career-vault");
    const encodedFilePath = encodeURIComponent(filePath);
    const fileUrl = `${this.getApiBase(config)}/projects/${targetId}/repository/files/${encodedFilePath}`;

    try {
      // Check if file exists
      const checkRes = await fetch(`${fileUrl}?ref=${branch}`, {
        headers: { "PRIVATE-TOKEN": token.trim() },
      });

      const method = checkRes.ok ? "PUT" : "POST";
      const payload = {
        branch,
        commit_message: commitMessage,
        content: utf8ToBase64(content),
        encoding: "base64",
      };

      const writeRes = await fetch(fileUrl, {
        method,
        headers: {
          "PRIVATE-TOKEN": token.trim(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!writeRes.ok) {
        const err = await writeRes.json();
        return { success: false, error: err.message || "GitLab commit failed" };
      }

      return { success: true };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : "GitLab sync error" };
    }
  }

  static async syncEncryptedChatSession(
    config: GitLabSyncConfig,
    sessionId: string,
    title: string,
    messages: Array<{ role: string; content: string; createdAt?: string }>,
    passphrase?: string
  ): Promise<GitHubFileCommitResult> {
    const rawPayload = {
      id: sessionId,
      title,
      messages,
      updatedAt: Date.now(),
    };

    let contentToSave: string;
    if (passphrase && passphrase.trim().length > 0) {
      const { encryptPayload } = await import("@/lib/crypto/encryption");
      contentToSave = await encryptPayload(rawPayload, passphrase);
    } else {
      contentToSave = JSON.stringify(rawPayload, null, 2);
    }

    return this.commitFile(
      config,
      `chats/${sessionId}.json`,
      contentToSave,
      `sync(gitlab-encrypted-chat): update session ${title.slice(0, 30)}`
    );
  }

  static async syncEncryptedResume(
    config: GitLabSyncConfig,
    title: string,
    resumeData: Record<string, unknown>,
    passphrase?: string
  ): Promise<GitHubFileCommitResult> {
    let contentToSave: string;
    if (passphrase && passphrase.trim().length > 0) {
      const { encryptPayload } = await import("@/lib/crypto/encryption");
      contentToSave = await encryptPayload(resumeData, passphrase);
    } else {
      contentToSave = JSON.stringify(resumeData, null, 2);
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "resume";
    return this.commitFile(
      config,
      `resumes/${slug}.json`,
      contentToSave,
      `sync(gitlab-encrypted-resume): update ${title}`
    );
  }
}


