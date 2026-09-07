import { tryLocalStorageGet, tryLocalStorageSet } from "@/lib/safe-local-storage";
import { PROFILE_STORE_ID, type UserProfile } from "@/components/chat/profile-settings-dialog";

/**
 * Get current Memory Vault plain markdown content from localStorage.
 */
export function getMemoryVaultContent(): string {
  if (typeof window === "undefined") return "";
  try {
    const raw = tryLocalStorageGet(PROFILE_STORE_ID);
    if (!raw) return "";
    const p = JSON.parse(raw) as Partial<UserProfile>;
    return p.ragKnowledgeBase || "";
  } catch {
    return "";
  }
}

/**
 * Set and save Memory Vault content into localStorage and notify all listeners.
 */
export function setMemoryVaultContent(content: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = tryLocalStorageGet(PROFILE_STORE_ID);
    const prev: Partial<UserProfile> = raw ? JSON.parse(raw) : {};
    const updated: UserProfile = {
      name: prev.name || "",
      email: prev.email || "",
      phone: prev.phone || "",
      location: prev.location || "",
      linkedin: prev.linkedin || "",
      website: prev.website || "",
      github: prev.github || "",
      profilePicture: prev.profilePicture || "",
      defaultEmailProvider: prev.defaultEmailProvider || "gmail",
      targetRoles: prev.targetRoles || "",
      careerNotes: prev.careerNotes || "",
      masterSkills: prev.masterSkills || "",
      masterExperience: prev.masterExperience || "",
      masterProjects: prev.masterProjects || "",
      masterEducation: prev.masterEducation || "",
      masterCertifications: prev.masterCertifications || "",
      ragKnowledgeBase: content,
      githubToken: prev.githubToken || "",
      githubRepo: prev.githubRepo || "career-agent-backup",
      autoSyncGithub: Boolean(prev.autoSyncGithub),
    };
    tryLocalStorageSet(PROFILE_STORE_ID, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("ai-chat-profile-updated"));
    return true;
  } catch (e) {
    console.error("Failed to save Memory Vault content:", e);
    return false;
  }
}

/**
 * Append an ingested document or markdown snippet to the user's persistent Memory Vault.
 */
export function appendDocumentToMemoryVault(docName: string, text: string): boolean {
  const current = getMemoryVaultContent().trim();
  const cleanDocName = docName.trim() || "Attached Document";
  const cleanText = text.trim();

  if (!cleanText) return false;

  const header = `\n\n## Ingested Document: ${cleanDocName}\n*Added on ${new Date().toLocaleDateString()}*\n\n`;
  const nextContent = current ? `${current}${header}${cleanText}` : `# Master Career Memory Vault\n${header}${cleanText}`;

  return setMemoryVaultContent(nextContent);
}

/**
 * Upload, parse, and ingest a PDF/document into the Memory Vault.
 */
export async function parseAndIngestFileToMemoryVault(file: File): Promise<{
  success: boolean;
  name: string;
  text?: string;
  error?: string;
}> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/memory-vault/parse", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        success: false,
        name: file.name,
        error: err.error || `HTTP ${res.status} error`,
      };
    }

    const data = await res.json();
    if (!data.success || !data.text) {
      return {
        success: false,
        name: file.name,
        error: data.error || "No text could be extracted from this document.",
      };
    }

    const saved = appendDocumentToMemoryVault(data.name || file.name, data.text);
    if (!saved) {
      return {
        success: false,
        name: file.name,
        error: "Failed to persist document to local storage.",
      };
    }

    return {
      success: true,
      name: data.name || file.name,
      text: data.text,
    };
  } catch (err) {
    return {
      success: false,
      name: file.name,
      error: err instanceof Error ? err.message : "Unknown error parsing file",
    };
  }
}
