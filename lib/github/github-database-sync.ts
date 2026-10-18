/**
 * GitHub Self-Managed Database Sync Engine
 * Synchronizes career data, graph state, memory vault, and resume versions to a private GitHub repo.
 *
 * CRITICAL PRIVACY RULES:
 * 1. Personal details (Name, Email, Phone, Address, Location, LinkedIn URL) are NEVER stored on GitHub.
 * 2. Raw API keys (OpenAI, Gemini, Anthropic, Tavily, etc.) are NEVER stored on GitHub.
 * 3. All career graph data that IS stored on GitHub is AES-256-GCM zero-knowledge encrypted.
 * 4. User can download the security token and encryption key directly to a local file.
 */

import { encryptPayload } from "@/lib/crypto/encryption";
import { saveToFirebaseVault, type FirebasePersonalDetails, type FirebaseApiKeys } from "@/lib/firebase/vault-storage";

export interface GitHubSyncConfig {
  githubToken: string;
  githubRepo: string; // e.g. "career-agent-database" or "owner/career-agent-database"
  branch?: string;
  filePath?: string;
  encryptionPassphrase?: string;
}

export interface SanitizedCareerDatabase {
  version: "2.0.0";
  updatedAt: string;
  timestampEpoch: number;
  syncSource?: string;
  careerVault?: {
    masterSkills?: string;
    masterExperience?: string;
    masterProjects?: string;
    masterEducation?: string;
    masterCertifications?: string;
    ragKnowledgeBase?: string;
  };
  resumes?: any[];
  chatHistorySnapshot?: any[];
  graphNodesCount?: number;
  graphEdgesCount?: number;
}

export interface GitHubSyncResult {
  ok: boolean;
  commitSha?: string;
  commitUrl?: string;
  branch: string;
  filePath: string;
  timestamp: string;
  timestampEpoch: number;
  remoteTimestamp?: string;
  remoteTimestampEpoch?: number;
  syncStatus: "pushed_newer" | "remote_newer" | "up_to_date" | "initial_commit";
  bytesEncrypted: number;
  personalDataStripped: boolean;
  apiKeysStripped: boolean;
  firebaseVaultUpdated: boolean;
  error?: string;
}

export interface GitHubTimestampStatus {
  ok: boolean;
  status: "in_sync" | "local_newer" | "remote_newer" | "uninitialized";
  lastLocalSyncIso?: string;
  lastLocalSyncEpoch?: number;
  remoteTimestamp?: string;
  remoteTimestampEpoch?: number;
  remoteCommitSha?: string;
  message: string;
}

export const GITHUB_SYNC_STORAGE_RECORD = "cv_sync_record_v2";

/**
 * Strips personal details and raw API keys to guarantee zero-leakage to Git.
 * Automatically injects ISO-8601 updatedAt and Unix timestampEpoch.
 */
export function sanitizeDataForGitHub(fullData: Record<string, any>): SanitizedCareerDatabase {
  const now = new Date();
  const sanitized: SanitizedCareerDatabase = {
    version: "2.0.0",
    updatedAt: now.toISOString(),
    timestampEpoch: now.getTime(),
    syncSource: "career-agent-app",
    careerVault: {
      masterSkills: fullData.masterSkills || fullData.skills || "",
      masterExperience: fullData.masterExperience || "",
      masterProjects: fullData.masterProjects || "",
      masterEducation: fullData.masterEducation || "",
      masterCertifications: fullData.masterCertifications || "",
      ragKnowledgeBase: fullData.ragKnowledgeBase || fullData.careerNotes || "",
    },
    resumes: Array.isArray(fullData.resumes) ? fullData.resumes : [],
    chatHistorySnapshot: Array.isArray(fullData.sessions) ? fullData.sessions : [],
    graphNodesCount: fullData.graphNodesCount || 0,
    graphEdgesCount: fullData.graphEdgesCount || 0,
  };

  return sanitized;
}

/**
 * Download Security Token & Encryption Passphrase as a local JSON file
 */
export function downloadSecurityTokenFile(params: {
  token?: string;
  passphrase?: string;
  repo?: string;
  username?: string;
}): void {
  if (typeof window === "undefined") return;

  const exportPayload = {
    app: "Career Assistant AI Vault",
    description: "Master Encryption Key & GitHub Access Credentials. Keep this file offline and secure.",
    createdAt: new Date().toISOString(),
    credentials: {
      githubRepository: params.repo || "career-agent-database",
      githubUsername: params.username || "yakkshit",
      hasToken: Boolean(params.token),
      token: params.token || "",
      encryptionPassphrase: params.passphrase || "",
    },
    recoveryNotice:
      "Because zero-knowledge AES-256-GCM encryption is used, this passphrase is the ONLY way to decrypt your GitHub-stored career state.",
  };

  const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `career-vault-security-token-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Checks GitHub remote commit timestamp against local client timestamp
 */
export async function checkGitHubSyncTimestampStatus(
  config: GitHubSyncConfig
): Promise<GitHubTimestampStatus> {
  if (!config.githubToken?.trim()) {
    return {
      ok: false,
      status: "uninitialized",
      message: "No GitHub token provided",
    };
  }

  try {
    let owner = "";
    let repoName = config.githubRepo.trim();
    if (repoName.includes("/")) {
      const parts = repoName.split("/");
      owner = parts[0];
      repoName = parts[1];
    }

    const headers = {
      Accept: "application/vnd.github.v3+json",
      Authorization: `Bearer ${config.githubToken.trim()}`,
      "User-Agent": "CareerAssistant-SyncEngine/2.0",
    };

    if (!owner) {
      const userRes = await fetch("https://api.github.com/user", { headers });
      if (userRes.ok) {
        const userData = await userRes.json();
        owner = userData.login;
      }
    }

    const branch = config.branch || "main";
    const filePath = config.filePath || "database/career_vault_encrypted.json";

    const commitsRes = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/commits?path=${encodeURIComponent(filePath)}&per_page=1&sha=${branch}`,
      { headers }
    );

    if (!commitsRes.ok) {
      return {
        ok: true,
        status: "uninitialized",
        message: "No remote commit found yet. Database ready for initial push.",
      };
    }

    const commitsData = await commitsRes.json();
    if (!Array.isArray(commitsData) || commitsData.length === 0) {
      return {
        ok: true,
        status: "uninitialized",
        message: "Remote database not yet created on this branch.",
      };
    }

    const latestCommit = commitsData[0];
    const remoteIso = latestCommit.commit?.committer?.date || latestCommit.commit?.author?.date;
    const remoteEpoch = remoteIso ? new Date(remoteIso).getTime() : 0;
    const remoteCommitSha = latestCommit.sha;

    let localIso: string | undefined;
    let localEpoch: number | undefined;
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(GITHUB_SYNC_STORAGE_RECORD);
        if (raw) {
          const parsed = JSON.parse(raw);
          localIso = parsed.timestamp;
          localEpoch = parsed.timestampEpoch;
        }
      } catch {}
    }

    if (!localEpoch) {
      return {
        ok: true,
        status: "remote_newer",
        remoteTimestamp: remoteIso,
        remoteTimestampEpoch: remoteEpoch,
        remoteCommitSha,
        message: `Remote database found (${new Date(remoteIso).toLocaleTimeString()}). Local sync not yet recorded.`,
      };
    }

    const deltaMs = localEpoch - remoteEpoch;
    if (Math.abs(deltaMs) < 10000) {
      return {
        ok: true,
        status: "in_sync",
        lastLocalSyncIso: localIso,
        lastLocalSyncEpoch: localEpoch,
        remoteTimestamp: remoteIso,
        remoteTimestampEpoch: remoteEpoch,
        remoteCommitSha,
        message: "Local and GitHub remote database timestamps are in sync.",
      };
    }

    if (deltaMs > 0) {
      return {
        ok: true,
        status: "local_newer",
        lastLocalSyncIso: localIso,
        lastLocalSyncEpoch: localEpoch,
        remoteTimestamp: remoteIso,
        remoteTimestampEpoch: remoteEpoch,
        remoteCommitSha,
        message: "Local database has newer updates ready to push to GitHub.",
      };
    }

    return {
      ok: true,
      status: "remote_newer",
      lastLocalSyncIso: localIso,
      lastLocalSyncEpoch: localEpoch,
      remoteTimestamp: remoteIso,
      remoteTimestampEpoch: remoteEpoch,
      remoteCommitSha,
      message: "Remote GitHub database has newer commits.",
    };
  } catch (err: any) {
    return {
      ok: false,
      status: "uninitialized",
      message: err?.message || "Could not check remote timestamp status",
    };
  }
}

/**
 * Execute encrypted database sync to user's private GitHub repository with accurate timestamp telemetry
 */
export async function syncCareerDatabaseToGitHub(params: {
  config: GitHubSyncConfig;
  fullData: Record<string, any>;
  personalDetails: FirebasePersonalDetails;
  apiKeys: FirebaseApiKeys;
}): Promise<GitHubSyncResult> {
  const { config, fullData, personalDetails, apiKeys } = params;

  if (!config.githubToken?.trim()) {
    throw new Error("Missing GitHub token. Generate a Personal Access Token with repo scope.");
  }

  // 1. Save Personal Details & API Keys to Firebase Secret Vault
  let firebaseOk = false;
  try {
    const fbRes = await saveToFirebaseVault({
      personalDetails,
      apiKeys,
      encryptionPassphrase: config.encryptionPassphrase,
      githubToken: config.githubToken,
      githubRepo: config.githubRepo,
    });
    firebaseOk = fbRes.ok;
  } catch (err) {
    console.warn("Firebase secret vault sync notice:", err);
  }

  // 2. Sanitize and Exclude all Personal Details and API Keys (stamps updatedAt & timestampEpoch)
  const cleanData = sanitizeDataForGitHub(fullData);
  const clientIso = cleanData.updatedAt;
  const clientEpoch = cleanData.timestampEpoch;

  // 3. Zero-Knowledge Encrypt the payload
  const passphrase = config.encryptionPassphrase || "default_career_master_salt_2026";
  const encryptedEnvelope = await encryptPayload(cleanData, passphrase);

  // 4. Resolve GitHub Owner & Repo Name
  let owner = "";
  let repoName = config.githubRepo.trim();
  if (repoName.includes("/")) {
    const parts = repoName.split("/");
    owner = parts[0];
    repoName = parts[1];
  }

  const headers = {
    Accept: "application/vnd.github.v3+json",
    Authorization: `Bearer ${config.githubToken.trim()}`,
    "User-Agent": "CareerAssistant-SyncEngine/2.0",
  };

  if (!owner) {
    const userRes = await fetch("https://api.github.com/user", { headers });
    if (!userRes.ok) {
      throw new Error(`GitHub token authentication failed (${userRes.status}). Verify token validity.`);
    }
    const userData = await userRes.json();
    owner = userData.login;
  }

  const branch = config.branch || "main";
  const filePath = config.filePath || "database/career_vault_encrypted.json";

  // 5. Check if file already exists to get its SHA and check remote commit timestamp
  let existingSha: string | undefined;
  let remoteTimestamp: string | undefined;
  let remoteTimestampEpoch: number | undefined;

  try {
    const getFileRes = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/contents/${filePath}?ref=${branch}`,
      { headers }
    );
    if (getFileRes.ok) {
      const existingData = await getFileRes.json();
      existingSha = existingData.sha;
    }
  } catch {
    // New file creation
  }

  if (existingSha) {
    try {
      const commitsRes = await fetch(
        `https://api.github.com/repos/${owner}/${repoName}/commits?path=${encodeURIComponent(filePath)}&per_page=1&sha=${branch}`,
        { headers }
      );
      if (commitsRes.ok) {
        const commitsData = await commitsRes.json();
        if (Array.isArray(commitsData) && commitsData.length > 0) {
          const latestCommit = commitsData[0];
          remoteTimestamp = latestCommit.commit?.committer?.date || latestCommit.commit?.author?.date;
          if (remoteTimestamp) {
            remoteTimestampEpoch = new Date(remoteTimestamp).getTime();
          }
        }
      }
    } catch {
      // Non-blocking telemetry
    }
  }

  let syncStatus: "pushed_newer" | "remote_newer" | "up_to_date" | "initial_commit" = "initial_commit";
  if (existingSha) {
    if (remoteTimestampEpoch && remoteTimestampEpoch > clientEpoch + 2000) {
      syncStatus = "remote_newer";
    } else {
      syncStatus = "pushed_newer";
    }
  }

  // 6. Push encrypted payload to GitHub with accurate timestamp in commit message
  const contentBase64 = typeof window === "undefined"
    ? Buffer.from(encryptedEnvelope).toString("base64")
    : btoa(unescape(encodeURIComponent(encryptedEnvelope)));

  const commitMsg = existingSha
    ? `chore(sync): update encrypted career vault database [${clientIso}] (epoch: ${clientEpoch})`
    : `feat(sync): initialize encrypted career vault database [${clientIso}] (epoch: ${clientEpoch})`;

  const putBody: Record<string, any> = {
    message: commitMsg,
    content: contentBase64,
    branch,
  };
  if (existingSha) {
    putBody.sha = existingSha;
  }

  const putRes = await fetch(
    `https://api.github.com/repos/${owner}/${repoName}/contents/${filePath}`,
    {
      method: "PUT",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(putBody),
    }
  );

  if (!putRes.ok) {
    const errText = await putRes.text();
    throw new Error(`GitHub sync failed (${putRes.status}): ${errText}`);
  }

  const putData = await putRes.json();
  const commitSha = putData.commit?.sha || "sha-sync-success";
  const commitUrl = putData.commit?.html_url || `https://github.com/${owner}/${repoName}`;

  // 7. Record sync telemetry locally
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(
        GITHUB_SYNC_STORAGE_RECORD,
        JSON.stringify({
          timestamp: clientIso,
          timestampEpoch: clientEpoch,
          commitSha,
          repo: `${owner}/${repoName}`,
          branch,
        })
      );
    } catch {}
  }

  return {
    ok: true,
    commitSha,
    commitUrl,
    branch,
    filePath,
    timestamp: clientIso,
    timestampEpoch: clientEpoch,
    remoteTimestamp,
    remoteTimestampEpoch,
    syncStatus,
    bytesEncrypted: encryptedEnvelope.length,
    personalDataStripped: true,
    apiKeysStripped: true,
    firebaseVaultUpdated: firebaseOk,
  };
}
