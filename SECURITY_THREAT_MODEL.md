# 🛡️ Production Threat Model & Security Posture Update (R1–R12)

**Application:** CareerAgent (`resume.cedzlabs.com`)  
**Specification:** Post-Fix Hardening & Multi-Instance Serverless Topology  
**Status:** ALL GATES PASSED (207/207 tests passing, 0 TypeScript errors, 0 Secret Leaks)

---

## 📋 Risk Matrix & Remediation Verification

| Risk ID | Description & Vulnerability Mode | Mitigating Task | Technical Implementation | Verification Gate & Test Link |
|---|---|---|---|---|
| **R1** | In-memory cache desynchronization across serverless instances | **T1** (Versioned Read-Through) | Replaced static in-memory returns with remote document version validation. Cache is only served if local version matches remote `_meta.version`. | [`__tests__/mcp-vault-sync-integrity.test.ts`](file:///Users/yakkshit/Downloads/project/resume/cv-main/__tests__/mcp-vault-sync-integrity.test.ts) (`implements versioned read-through so concurrent instances observe fresh remote vault state`) |
| **R2** | Stale concurrent writes destroying vault data (Last-Write-Wins) | **T2** (CAS Optimistic Concurrency) | Enforced `expectedVersion` check inside `saveUserMemoryVaultContent` and `/api/memory-vault/sync`. Stale writes throw `VaultVersionConflictError` (HTTP 409). | [`__tests__/mcp-vault-sync-integrity.test.ts`](file:///Users/yakkshit/Downloads/project/resume/cv-main/__tests__/mcp-vault-sync-integrity.test.ts) (`enforces CAS optimistic concurrency on writes and fails loudly on stale version`) |
| **R3** | Hardcoded/fixed repo names leaking cross-tenant blobs; AES key leakage | **T3** (User-Scoped Repos & Zero-Knowledge) | (1) Repositories are deterministically scoped via `deriveUserScopedRepoName(uid)`.<br>(2) Pushing/pulling against non-owned repos strictly throws `CrossTenantSecurityViolation`.<br>(3) Raw encryption passphrase is never stored server-side; only non-reversible SHA-256 key fingerprints are kept. | [`__tests__/mcp-vault-sync-integrity.test.ts`](file:///Users/yakkshit/Downloads/project/resume/cv-main/__tests__/mcp-vault-sync-integrity.test.ts) (`derives user-scoped repo names and prevents cross-tenant repo access`) & [`lib/github/github-database-sync.ts`](file:///Users/yakkshit/Downloads/project/resume/cv-main/lib/github/github-database-sync.ts) |
| **R4** | Public/None mode allowing unauthenticated state mutations | **T4** (Server-Side Auth Matrix) | `verifyMcpRequestAuth` enforces that all write/mutating tools (`append_*`, `update_*`, `save_*`, `create_*`, `delete_*`) require valid Bearer or OAuth credentials, even if endpoint is in Public mode. | [`__tests__/dynamic-mcp-rest.test.ts`](file:///Users/yakkshit/Downloads/project/resume/cv-main/__tests__/dynamic-mcp-rest.test.ts) (`appends and reads shared Memory Vault via tools, rejecting unauthenticated writes in public mode`) |
| **R5** | Firestore 1 MiB document limit crash on large resumes/vaults | **T6** (Vault Document Ceiling) | Enforced hard 850KB ceiling check before Firestore persistence. Large payloads fail gracefully with `VaultLimitExceededError` (HTTP 413) instead of partial truncation. | [`__tests__/mcp-vault-sync-integrity.test.ts`](file:///Users/yakkshit/Downloads/project/resume/cv-main/__tests__/mcp-vault-sync-integrity.test.ts) (`enforces 850KB ceiling and prevents silent truncation or document limit crash`) |
| **R6** | IDOR / enumeration of private user avatars via `/api/avatar/[userId]` | **T5** (Avatar Privacy Guard) | Verified privacy status before serving. If `isPrivate: true` or `avatarVisibility: "private"`, anonymous requests receive 404 with `Cache-Control: private, no-store`. | [`app/api/avatar/[userId]/route.ts`](file:///Users/yakkshit/Downloads/project/resume/cv-main/app/api/avatar/[userId]/route.ts) & [`__tests__/mcp-vault-sync-integrity.test.ts`](file:///Users/yakkshit/Downloads/project/resume/cv-main/__tests__/mcp-vault-sync-integrity.test.ts) |
| **R7** | Avatar EXIF metadata leak (GPS/device) and decompression bombs | **T5** (Image Sanitizer) | Implemented zero-dependency `sanitizeAndValidateImage` stripping EXIF/APP1-APP15/eXIf chunks and rejecting images exceeding 4096x4096px. Content-hash `?v={hash}` appended to URLs. | [`lib/crypto/image-sanitizer.ts`](file:///Users/yakkshit/Downloads/project/resume/cv-main/lib/crypto/image-sanitizer.ts) & [`__tests__/mcp-vault-sync-integrity.test.ts`](file:///Users/yakkshit/Downloads/project/resume/cv-main/__tests__/mcp-vault-sync-integrity.test.ts) |
| **R8** | Silent assertion weakening during agent test fix cycles | **T7** (Test-Suite Integrity Audit) | Diffed all test suites. No assertions were loosened; 6 new hardening tests were added. Verified with mutation test deliberately breaking CAS logic (went RED). | Mutation test execution confirmed in step history; full suite green across 207 tests. |
| **R9** | Test isolation discrepancies in mock vs runtime topologies | **T7** (Multi-Instance Simulated Topology) | Created multi-process simulation test verifying two concurrent readers observe independent mutations across state stores. | [`__tests__/mcp-vault-sync-integrity.test.ts`](file:///Users/yakkshit/Downloads/project/resume/cv-main/__tests__/mcp-vault-sync-integrity.test.ts) |
| **R10** | Schema drift breaking external MCP clients (Cursor, Gemini) | **T8** (Wire Schema Contract) | `get_memory_vault` preserves root `vaultMarkdown` and `careerVault` string fields while exposing `_meta: { lastUpdated, version, source }`. | [`__tests__/dynamic-mcp-rest.test.ts`](file:///Users/yakkshit/Downloads/project/resume/cv-main/__tests__/dynamic-mcp-rest.test.ts) & [`lib/mcp/mcp-tools-catalog.ts`](file:///Users/yakkshit/Downloads/project/resume/cv-main/lib/mcp/mcp-tools-catalog.ts) |
| **R11** | Internal fan-out amplification exhausting quota | **T9** (Cost-Weighted Quota Engine) | `checkAndConsumeQuota` supports weighted cost accounting. Mutation operations consume proportionate quota units with standard `X-RateLimit-*` headers. | [`lib/firebase/mcp-storage.ts`](file:///Users/yakkshit/Downloads/project/resume/cv-main/lib/firebase/mcp-storage.ts) |
| **R12** | Silent failures on decryption, checksum mismatch, or auth rejections | **T11** (Audit Logging) | Integrated `logMcpExecution` across rejected writes, version conflicts, rate-limits, and sync updates. | [`app/api/memory-vault/sync/route.ts`](file:///Users/yakkshit/Downloads/project/resume/cv-main/app/api/memory-vault/sync/route.ts) & [`app/api/mcp/rest/[slug]/route.ts`](file:///Users/yakkshit/Downloads/project/resume/cv-main/app/api/mcp/rest/[slug]/route.ts) |

---

## 🔒 Verification Command Summary
```bash
npx tsc --noEmit
# Result: 0 errors

npx vitest run
# Result: 41 test files passed, 207 tests passed (0 failures)

npx vitest run __tests__/security-audit.test.ts
# Result: 0 hardcoded secrets or leaks detected
```
