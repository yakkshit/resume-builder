import { describe, it, expect } from "vitest";
import { buildUserKnowledgeStoreChunks } from "@/lib/user-knowledge-context";

describe("Master Career RAG Vault Knowledge Ingestion", () => {
  it("ingests plain markdown master knowledge base into RAG context", () => {
    const resume = {
      basicInfo: {
        name: "Alex Rivera",
        title: "Senior AI Engineer",
        summary: "Specialized in LLM architectures and retrieval systems.",
      },
      skills: ["PyTorch", "TypeScript", "Next.js"],
      experience: [],
      education: [],
      projects: [],
      achievements: [],
    };

    const profile = {
      targetRoles: "Staff AI Engineer / Tech Lead",
      careerNotes: "Seeking remote US or EU positions.",
      ragKnowledgeBase: `# Master Career Vault
## Proven Impact
- Designed distributed vector search reducing p99 latency from 450ms to 32ms.
- Authored 3 patents in real-time neural streaming.

## Target Companies & Domains
- High growth AI infrastructure & Agentic workflows.`,
    };

    const chunks = buildUserKnowledgeStoreChunks(resume, profile);

    // Verify Master RAG chunk is present with explicit label
    expect(chunks).toContain("[chunk:master_rag_career_knowledge_vault]");
    expect(chunks).toContain("Designed distributed vector search reducing p99 latency");
    expect(chunks).toContain("Authored 3 patents in real-time neural streaming");
    expect(chunks).toContain("High growth AI infrastructure & Agentic workflows");

    // Verify global user profile metadata is still preserved alongside vault
    expect(chunks).toContain("[chunk:global_user_profile]");
    expect(chunks).toContain("targetRoles: Staff AI Engineer / Tech Lead");
    expect(chunks).toContain("[chunk:resume_summary]");
    expect(chunks).toContain("Specialized in LLM architectures");
  });

  it("handles empty or whitespace-only RAG knowledge base gracefully without adding empty chunks", () => {
    const resume = {
      basicInfo: { name: "Taylor Doe", title: "Product Designer" },
      skills: ["Figma", "UI/UX"],
    };

    const profile = {
      targetRoles: "Design Lead",
      ragKnowledgeBase: "   \n\n  ",
    };

    const chunks = buildUserKnowledgeStoreChunks(resume, profile);
    expect(chunks).not.toContain("[chunk:master_rag_career_knowledge_vault]");
    expect(chunks).toContain("[chunk:global_user_profile]");
  });
});
