import { describe, it, expect } from "vitest";
import { sanitizeDataForGitHub } from "@/lib/github/github-database-sync";
import { encryptPayload, decryptPayload } from "@/lib/crypto/encryption";

describe("GitHub Self-Managed Database Sync & Privacy Isolation", () => {
  const fullUserProfile = {
    name: "Yakkshit Sai",
    email: "yakkshit.tactopus@gmail.com",
    phone: "+49 1713562972",
    location: "Konstanz, Germany",
    linkedin: "https://linkedin.com/in/yakkshit",
    targetRoles: "Full Stack Developer",
    careerNotes: "Passionate about generative AI, TypeScript, and distributed systems",
    apiKeys: {
      openai: "sk-proj-supersecretkey12345",
      gemini: "AIzaSySecretGeminiKey999",
      tavily: "tvly-secretkey",
    },
    masterSkills: "TypeScript, React, Next.js, Node.js, Python, PostgreSQL",
    masterExperience: "Software Engineer at Tactopus (2022 - Present)",
    masterProjects: "AI Resume & Career Assistant Pro",
    masterEducation: "M.Sc Computer Science",
  };

  it("strictly strips personal identity and API keys from GitHub export payload", () => {
    const sanitized = sanitizeDataForGitHub(fullUserProfile);

    // Verify version & schema
    expect(sanitized.version).toBe("2.0.0");
    expect(sanitized.careerVault?.masterSkills).toBe(fullUserProfile.masterSkills);
    expect(sanitized.careerVault?.masterExperience).toBe(fullUserProfile.masterExperience);

    // Personal details must NOT exist in the root or nested objects
    const jsonStr = JSON.stringify(sanitized);
    expect(jsonStr).not.toContain("yakkshit.tactopus@gmail.com");
    expect(jsonStr).not.toContain("+49 1713562972");
    expect(jsonStr).not.toContain("sk-proj-supersecretkey12345");
    expect(jsonStr).not.toContain("AIzaSySecretGeminiKey999");
    expect(jsonStr).not.toContain("tvly-secretkey");
  });

  it("encrypts sanitized payload using zero-knowledge AES-256-GCM before git push", async () => {
    const sanitized = sanitizeDataForGitHub(fullUserProfile);
    const passphrase = "master_test_passphrase_999";

    const encrypted = await encryptPayload(sanitized, passphrase);
    expect(typeof encrypted).toBe("string");
    expect(encrypted).not.toContain("Tactopus");
    expect(encrypted).not.toContain("Master Career Memory Vault");

    // Decrypts accurately
    const decryptedJson = await decryptPayload(encrypted, passphrase);
    const decrypted = JSON.parse(decryptedJson);
    expect(decrypted.careerVault.masterSkills).toContain("TypeScript");
    expect(decrypted.careerVault.masterExperience).toContain("Tactopus");
  });

  it("stamps precise updatedAt ISO string and timestampEpoch for Git commit synchronization", () => {
    const before = Date.now();
    const sanitized = sanitizeDataForGitHub(fullUserProfile);
    const after = Date.now();

    expect(typeof sanitized.updatedAt).toBe("string");
    expect(new Date(sanitized.updatedAt).getTime()).toBeGreaterThanOrEqual(before);
    expect(new Date(sanitized.updatedAt).getTime()).toBeLessThanOrEqual(after);
    expect(typeof sanitized.timestampEpoch).toBe("number");
    expect(sanitized.timestampEpoch).toBeGreaterThanOrEqual(before);
    expect(sanitized.timestampEpoch).toBeLessThanOrEqual(after);
  });
});
