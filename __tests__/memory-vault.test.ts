import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getMemoryVaultContent,
  setMemoryVaultContent,
  appendDocumentToMemoryVault,
} from "@/lib/memory-vault";
import { buildUserKnowledgeStoreChunks } from "@/lib/user-knowledge-context";

describe("Memory Vault Ingestion and Storage", () => {
  let store: Record<string, string> = {};

  beforeEach(() => {
    store = {};
    const mockLocalStorage = {
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, val: string) => {
        store[key] = val;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        store = {};
      }),
    };

    (globalThis as any).localStorage = mockLocalStorage;
    (globalThis as any).window = {
      localStorage: mockLocalStorage,
      dispatchEvent: vi.fn(),
    };
  });

  it("stores and retrieves Memory Vault content properly", () => {
    const initial = getMemoryVaultContent();
    expect(initial).toBe("");

    const markdown = `# Master Career Memory Vault\n\n## Target Roles\n- Principal AI Robotics Engineer`;
    const ok = setMemoryVaultContent(markdown);
    expect(ok).toBe(true);

    const retrieved = getMemoryVaultContent();
    expect(retrieved).toBe(markdown);
  });

  it("appends ingested document markdown to Memory Vault", () => {
    setMemoryVaultContent("# Initial Career Notes");

    const docName = "Staff_Engineer_Resume.pdf";
    const docText = "Engineered micro-agent orchestration pipeline with 99.99% uptime.";

    const success = appendDocumentToMemoryVault(docName, docText);
    expect(success).toBe(true);

    const updated = getMemoryVaultContent();
    expect(updated).toContain("# Initial Career Notes");
    expect(updated).toContain("## Ingested Document: Staff_Engineer_Resume.pdf");
    expect(updated).toContain("Engineered micro-agent orchestration pipeline");
  });

  it("builds knowledge chunks with Memory Vault content for model grounding", () => {
    const resume = {
      basicInfo: { name: "Jordan Smith", title: "Full Stack Lead" },
      skills: ["React", "Go", "Kubernetes"],
    };

    const profile = {
      targetRoles: "Engineering Lead",
      ragKnowledgeBase: `# Memory Vault\n## Leadership\n- Led team of 12 engineers across 3 timezones.`,
    };

    const chunks = buildUserKnowledgeStoreChunks(resume, profile);
    expect(chunks).toContain("[chunk:master_rag_career_knowledge_vault]");
    expect(chunks).toContain("Led team of 12 engineers across 3 timezones");
    expect(chunks).toContain("[chunk:global_user_profile]");
    expect(chunks).toContain("targetRoles: Engineering Lead");
  });
});
