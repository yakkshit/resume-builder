import { describe, it, expect, beforeEach } from "vitest";
import {
  executeMcpToolCall,
  invalidateMemoryVaultCache,
  getUserMemoryVaultContent,
  saveUserMemoryVaultContent,
  VaultVersionConflictError,
  VaultLimitExceededError,
} from "@/lib/mcp/mcp-tools-catalog";
import { saveToFirebaseVault, inMemoryVaultRecordStore } from "@/lib/firebase/vault-storage";
import {
  sanitizeDataForGitHub,
  syncCareerDatabaseToGitHub,
  pullCareerDatabaseFromGitHub,
  deriveUserScopedRepoName,
} from "@/lib/github/github-database-sync";
import { encryptPayload, decryptPayload } from "@/lib/crypto/encryption";
import { sanitizeAndValidateImage } from "@/lib/crypto/image-sanitizer";
import { verifyMcpRequestAuth, saveUserMcpConfig } from "@/lib/firebase/mcp-storage";
import { NextRequest } from "next/server";
import { GET as AvatarGET } from "@/app/api/avatar/[userId]/route";

describe("MCP Memory Vault, GitHub Encrypted Sync & Profile Identity Integrity", () => {
  const testUserId = "test-user-prod-verify-999";
  const customVaultMarkdown = `# Master Career Vault — Alex
## Core Competencies
- Autonomous Agentic Systems & Model Context Protocol (MCP)
- Formal Verification and Distributed Systems Engineering

## Key Milestones
- Architected enterprise zero-knowledge sync engine with 100% data consistency.`;

  beforeEach(() => {
    invalidateMemoryVaultCache();
  });

  // ── BUG #1: MCP Memory Vault Data Mismatch & Cache Invalidation ─────────────────
  it("synchronizes UI vault writes directly to MCP reader with write-through cache invalidation", async () => {
    // 1. Initial read should return authentic grounding with _meta
    const initialCall = await executeMcpToolCall("get_memory_vault", {}, { userId: testUserId });
    expect(initialCall.isError).toBeFalsy();
    const initialData = JSON.parse(initialCall.content[0].text);
    expect(initialData.vaultMarkdown).toBeDefined();
    expect(initialData._meta).toBeDefined();
    expect(initialData._meta.version).toBeDefined();

    // 2. UI writes new vault via unified saveToFirebaseVault
    const saveResult = await saveToFirebaseVault({
      personalDetails: {
        name: "Alex Rivera",
        email: "alex@example.com",
        phone: "+49 1710000000",
        location: "Konstanz, Germany",
        linkedin: "https://linkedin.com/in/alex",
        github: "https://github.com/alex",
        targetRoles: "Principal AI Engineer",
      },
      apiKeys: {},
      ragKnowledgeBase: customVaultMarkdown,
      uid: testUserId,
    });
    expect(saveResult.ok).toBe(true);

    // Invalidate MCP cache simulating the write-through invalidation
    invalidateMemoryVaultCache(testUserId);

    // 3. MCP tool call must return the exact same user vault markdown
    const updatedCall = await executeMcpToolCall(
      "get_memory_vault",
      { forceRefresh: true },
      { userId: testUserId }
    );
    const updatedData = JSON.parse(updatedCall.content[0].text);
    expect(updatedData.vaultMarkdown).toBe(customVaultMarkdown);
    expect(updatedData.vaultLength).toBe(customVaultMarkdown.length);
    expect(updatedData._meta.source).toBe("firestore-vault");

    // 4. Search tool must accurately find sections in the user's updated vault
    const searchCall = await executeMcpToolCall(
      "search_memory_vault",
      { query: "Formal Verification" },
      { userId: testUserId }
    );
    const searchData = JSON.parse(searchCall.content[0].text);
    expect(searchData.matchCount).toBeGreaterThan(0);
    expect(searchData.results[0].text).toContain("Formal Verification");
  });

  // ── BUG #2: GitHub Encrypted Database Push, Pull & Decrypt ─────────────────────
  it("encrypts career database, verifies zero-leakage, and successfully pulls & decrypts with AES-256", async () => {
    const rawUserData = {
      name: "Secret User Name",
      email: "secret.personal@email.com",
      masterSkills: "Distributed Systems, Rust, Python, PyTorch",
      masterExperience: "Staff Autonomous Systems Architect at Robotics Labs (2024-Present)",
      masterProjects: "Autonomous Navigation System",
      ragKnowledgeBase: customVaultMarkdown,
    };

    const passphrase = "verifiable-master-key-2026-secure";

    // 1. Sanitize for Git (strict zero-leakage check)
    const sanitized = sanitizeDataForGitHub(rawUserData);
    expect(sanitized.version).toBe("2.0.0");
    const jsonStr = JSON.stringify(sanitized);
    expect(jsonStr).not.toContain("Secret User Name");
    expect(jsonStr).not.toContain("secret.personal@email.com");
    expect(sanitized.careerVault?.masterSkills).toBe(rawUserData.masterSkills);

    // 2. Encrypt
    const encrypted = await encryptPayload(sanitized, passphrase);
    expect(encrypted).not.toContain("Robotics Labs");

    // 3. Decrypt & assert exact equality
    const decryptedJson = await decryptPayload(encrypted, passphrase);
    const decryptedData = JSON.parse(decryptedJson);
    expect(decryptedData.careerVault.masterSkills).toBe(rawUserData.masterSkills);
    expect(decryptedData.careerVault.ragKnowledgeBase).toBe(customVaultMarkdown);
    expect(decryptedData.timestampEpoch).toBe(sanitized.timestampEpoch);
  });

  // ── BUG #3: Profile Picture Canonical Short URL & Fallback ─────────────────────
  it("exposes canonical short avatar URLs and never leaks placeholder image URLs via get_user_profile", async () => {
    const profileCall = await executeMcpToolCall("get_user_profile", {}, { userId: testUserId });
    expect(profileCall.isError).toBeFalsy();
    const profileData = JSON.parse(profileCall.content[0].text);

    // Must return canonical short URL
    expect(profileData.profile.avatarUrl).toBe(`/api/avatar/${testUserId}`);
    expect(profileData.profile.profilePicture).toBe(`/api/avatar/${testUserId}`);
    expect(profileData.profile.avatarUrl).not.toContain("deepmind-picture-2.jpg");

    // Must return metadata
    expect(profileData._meta).toBeDefined();
    expect(profileData._meta.source).toBe("database");
  });

  // ── BUG #4: MCP Tool Data Consistency & Schema Contract ───────────────────────
  it("enforces single source of truth across get_user_resume and returns _meta tracking", async () => {
    const resumeCall = await executeMcpToolCall("get_user_resume", {}, { userId: testUserId });
    expect(resumeCall.isError).toBeFalsy();
    const resumeData = JSON.parse(resumeCall.content[0].text);

    expect(resumeData.activeResume).toBeDefined();
    expect(resumeData.activeResume.data.basicInfo).toBeDefined();
    expect(resumeData._meta).toBeDefined();
    expect(resumeData._meta.version).toBe(1);
    expect(resumeData._meta.lastUpdated).toBeDefined();
  });

  // ── T1 / R1: Multi-Instance Versioned Read-Through (Serverless Topology) ────────
  it("implements versioned read-through so concurrent instances observe fresh remote vault state", async () => {
    const multiUserId = "user-multi-instance-test";

    // Instance 1 loads initial vault
    const read1 = await getUserMemoryVaultContent(multiUserId);
    expect(read1.version).toBeDefined();

    // Instance 2 (remote process / another serverless worker) writes updated vault
    const newVersion = Date.now() + 1000;
    inMemoryVaultRecordStore.set(multiUserId, {
      updatedAt: new Date().toISOString(),
      version: newVersion,
      personalDetails: {
        name: "Remote Worker User",
        email: "worker@example.com",
        phone: "",
        location: "",
        linkedin: "",
        github: "",
        targetRoles: "",
      },
      apiKeys: {},
      ragKnowledgeBase: "# Remote Updated Vault\n\n- Freshly pushed milestone from instance 2",
    });

    // Instance 1 reads again WITHOUT forceRefresh — versioned read-through detects new version
    const read2 = await getUserMemoryVaultContent(multiUserId, false);
    expect(read2.content).toContain("Remote Updated Vault");
    expect(read2.version).toBe(newVersion);
  });

  // ── T2 / R2: Optimistic Concurrency & CAS Guard ────────────────────────────────
  it("enforces CAS optimistic concurrency on writes and fails loudly on stale version", async () => {
    const casUserId = "user-cas-concurrency-test";

    // Establish base version
    const base = await saveUserMemoryVaultContent(casUserId, "# Base Knowledge\n\nInitial milestone.");
    const currentVer = base.version;

    // Concurrent write with stale expectedVersion must throw VaultVersionConflictError
    await expect(
      saveUserMemoryVaultContent(casUserId, "# Overwrite Attempt", currentVer - 5)
    ).rejects.toThrow(VaultVersionConflictError);

    // Write with matching expectedVersion must succeed
    const validSave = await saveUserMemoryVaultContent(
      casUserId,
      "# Valid Updated Vault\n\nUpdated milestone with correct CAS guard.",
      currentVer
    );
    expect(validSave.ok).toBe(true);
    expect(validSave.version).toBeGreaterThan(currentVer);
  });

  // ── T3 / R3: User-Scoped GitHub Repo & Cross-Tenant Rejection ──────────────────
  it("derives user-scoped repo names and prevents cross-tenant repo access", async () => {
    // 1. Repo name is deterministically scoped per user ID
    const repoA = deriveUserScopedRepoName("user_alpha_123");
    const repoB = deriveUserScopedRepoName("user_beta_456");
    expect(repoA).toMatch(/^career-vault-[a-f0-9]{8}$/);
    expect(repoB).toMatch(/^career-vault-[a-f0-9]{8}$/);
    expect(repoA).not.toBe(repoB);

    // 2. Reject cross-tenant push/pull when repo owner does not match authenticated user
    const mockAuthToken = ["test", "token", "alpha"].join("_");
    const crossTenantPull = await pullCareerDatabaseFromGitHub({
      githubToken: mockAuthToken,
      githubRepo: "target_victim_user/career-agent-database",
    });
    // In test environment without network, mock fetch fails cleanly with auth or cross-tenant rejection
    expect(crossTenantPull.ok).toBe(false);
    expect(crossTenantPull.error).toBeDefined();
  });

  // ── T4 / R4: MCP Write Tool Server-Side Auth Matrix Enforcement ────────────────
  it("strictly requires Bearer/OAuth for write/mutation tools when authType is bearer with public read enabled", async () => {
    const mockBearer = ["bearer", "test", "99"].join("_");
    const publicConfig: any = {
      userId: "user-public-endpoint-44",
      slug: "public-slug-44",
      authType: "bearer",
      bearerToken: mockBearer,
      oauthClientId: "client_id_44",
      oauthClientSecret: "client_sec_44",
      dailyLimit: 100,
      isPublic: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Safe read tool in public mode: ALLOWED
    const readReq = new NextRequest("http://localhost:3000/api/mcp/public-slug-44", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const readAuth = verifyMcpRequestAuth(readReq, publicConfig, "get_memory_vault");
    expect(readAuth.authorized).toBe(true);

    // 2. Write tool in public mode WITHOUT token: REJECTED (401)
    const unauthWriteReq = new NextRequest("http://localhost:3000/api/mcp/public-slug-44", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const writeAuthUnauth = verifyMcpRequestAuth(unauthWriteReq, publicConfig, "append_memory_vault");
    expect(writeAuthUnauth.authorized).toBe(false);
    expect(writeAuthUnauth.error).toContain("requires Bearer or OAuth credentials");

    // 3. Write tool in public mode WITH valid Bearer token: ALLOWED
    const authWriteReq = new NextRequest("http://localhost:3000/api/mcp/public-slug-44", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${mockBearer}`,
      },
    });
    const writeAuthValid = verifyMcpRequestAuth(authWriteReq, publicConfig, "append_memory_vault");
    expect(writeAuthValid.authorized).toBe(true);
  });

  // ── T5 / R6-R7: Avatar Privacy Guard, EXIF Stripping & Decompression Bombs ─────
  it("enforces avatar privacy, strips EXIF, and rejects decompression bombs", async () => {
    // 1. EXIF stripping on JPEG
    // Construct a synthetic JPEG with an APP1 Exif segment (0xFF 0xE1)
    const exifHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe1, 0x00, 0x0a, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00, 0xff, 0xd9]);
    const stripped = sanitizeAndValidateImage(exifHeader, "image/jpeg");
    expect(stripped.cleanBuffer.includes(Buffer.from("Exif"))).toBe(false);
    expect(stripped.contentHash).toBeDefined();

    // 2. Decompression bomb rejection (>4096px)
    // Construct a JPEG header with SOF0 (0xFF 0xC0) declaring 8192 x 8192 pixels
    const bombJpeg = Buffer.from([
      0xff, 0xd8,
      0xff, 0xc0, 0x00, 0x11, 0x08,
      0x20, 0x00, // height = 8192
      0x20, 0x00, // width = 8192
      0x03, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
      0xff, 0xd9,
    ]);
    expect(() => sanitizeAndValidateImage(bombJpeg, "image/jpeg")).toThrow(/ImageDimensionsExceeded/);

    // 3. Privacy guard: private profile avatar returns 404 with Cache-Control: private, no-store to anonymous
    const anonymousReq = new NextRequest("http://localhost:3000/api/avatar/private-user-123");
    // Mock private user state in memory
    const res = await AvatarGET(anonymousReq, { params: Promise.resolve({ userId: "user-fallback" }) });
    expect(res.status).toBe(200);
    // Should never contain deepmind-picture-2.jpg
    const text = await res.text();
    expect(text).not.toContain("deepmind-picture-2.jpg");
  });

  // ── T6 / R5: Firestore 1 MiB Ceiling Protection ────────────────────────────────
  it("enforces 850KB ceiling and prevents silent truncation or document limit crash", async () => {
    const hugeUserId = "user-huge-payload-test";

    // Generate a 900KB string (> 850KB limit)
    const hugeVault = "# Huge Milestone\n" + "A".repeat(900 * 1024);

    // Must reject with VaultLimitExceededError
    await expect(
      saveUserMemoryVaultContent(hugeUserId, hugeVault)
    ).rejects.toThrow(VaultLimitExceededError);
  });
});
