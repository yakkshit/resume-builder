import { VectorDocumentChunk, SimilaritySearchResult } from "./types";
import { generateLocalEmbedding, cosineSimilarity } from "./embeddings";

export class PersonalVectorStore {
  private chunks: VectorDocumentChunk[] = [];

  constructor(initialChunks: VectorDocumentChunk[] = []) {
    this.chunks = initialChunks;
  }

  /**
   * Add a document chunk, generating its vector embedding if missing.
   */
  public addChunk(chunk: VectorDocumentChunk): void {
    if (!chunk.embedding || chunk.embedding.length === 0) {
      chunk.embedding = generateLocalEmbedding(`${chunk.metadata.title} ${chunk.category} ${chunk.text}`);
    }
    this.chunks.push(chunk);
  }

  /**
   * Bulk add and embed document chunks.
   */
  public addChunks(chunks: VectorDocumentChunk[]): void {
    for (const chunk of chunks) {
      this.addChunk(chunk);
    }
  }

  public getChunksCount(): number {
    return this.chunks.length;
  }

  public getAllChunks(): VectorDocumentChunk[] {
    return this.chunks;
  }

  /**
   * Perform LangChain-compatible similarity search with confidence scoring.
   */
  public similaritySearchWithScore(
    query: string,
    k = 5,
    minThreshold = 0.15
  ): SimilaritySearchResult[] {
    if (!query.trim() || this.chunks.length === 0) return [];

    const queryEmbedding = generateLocalEmbedding(query);
    const scoredList: Array<{ chunk: VectorDocumentChunk; score: number }> = [];

    for (const chunk of this.chunks) {
      const chunkEmbedding = chunk.embedding || generateLocalEmbedding(`${chunk.metadata.title} ${chunk.category} ${chunk.text}`);
      const score = cosineSimilarity(queryEmbedding, chunkEmbedding);

      // Also compute exact keyword boost for domain terms
      const queryTerms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
      const textLower = chunk.text.toLowerCase();
      let keywordHits = 0;
      for (const term of queryTerms) {
        if (textLower.includes(term)) keywordHits++;
      }
      const keywordBoost = queryTerms.length > 0 ? (keywordHits / queryTerms.length) * 0.15 : 0;
      const combinedScore = Math.min(1.0, score + keywordBoost);

      if (combinedScore >= minThreshold) {
        scoredList.push({ chunk, score: combinedScore });
      }
    }

    // Sort descending by score
    scoredList.sort((a, b) => b.score - a.score);

    const topK = scoredList.slice(0, k);

    return topK.map((item, index) => {
      // Calibrate similarity score to intuitive human confidence (0 - 100%)
      // 0.70+ -> 95-99%
      // 0.50+ -> 85-94%
      // 0.35+ -> 70-84%
      // 0.20+ -> 50-69%
      let confidencePercent = Math.round(item.score * 100);
      if (item.score >= 0.65) {
        confidencePercent = Math.min(99, Math.round(88 + (item.score - 0.65) * 35));
      } else if (item.score >= 0.45) {
        confidencePercent = Math.round(75 + (item.score - 0.45) * 65);
      } else if (item.score >= 0.25) {
        confidencePercent = Math.round(55 + (item.score - 0.25) * 100);
      }

      return {
        chunk: item.chunk,
        score: Number(item.score.toFixed(3)),
        confidencePercent,
        rank: index + 1,
      };
    });
  }
}

/**
 * Ingest user data (Resume JSON, Profile, Memory Vault Markdown) and chunk into vector passages.
 */
export function buildPersonalVectorStore(
  resumeData?: any,
  profile?: any,
  memoryVaultMarkdown?: string
): PersonalVectorStore {
  const store = new PersonalVectorStore();

  // 1. Chunk Master Memory Vault Markdown by headings or double newlines
  const vaultText = (memoryVaultMarkdown || profile?.ragKnowledgeBase || "").trim();
  if (vaultText) {
    const sections: string[] = vaultText.split(/(?=\n#{1,3}\s+)/);
    sections.forEach((sec: string, idx: number) => {
      const cleanSec = sec.trim();
      if (cleanSec.length > 20) {
        const titleMatch = cleanSec.match(/^#{1,3}\s+(.+)$/m);
        const title = titleMatch ? titleMatch[1].trim() : `Memory Vault Excerpt #${idx + 1}`;
        store.addChunk({
          id: `vault_chunk_${idx + 1}`,
          text: cleanSec,
          source: "memory-vault",
          category: "Memory Vault Dossier",
          metadata: {
            title,
            section: title,
            timestamp: new Date().toISOString(),
          },
        });
      }
    });
  }

  // 2. Chunk Work Experiences
  if (Array.isArray(resumeData?.experience)) {
    resumeData.experience.forEach((exp: any, idx: number) => {
      const comp = exp.company || "Company";
      const pos = exp.position || "Role";
      const desc = exp.description || "";
      const highlights = Array.isArray(exp.highlights) ? exp.highlights.join("\n• ") : "";
      const text = `${pos} at ${comp} (${exp.startDate || ""} - ${exp.endDate || ""})\n${desc}\n${highlights ? `• ${highlights}` : ""}`.trim();

      if (text.length > 15) {
        store.addChunk({
          id: `exp_chunk_${idx + 1}`,
          text,
          source: "resume-experience",
          category: "Work Experience",
          metadata: {
            title: `${pos} - ${comp}`,
            role: pos,
            company: comp,
            skills: exp.skills || [],
          },
        });
      }
    });
  }

  // 3. Chunk Projects
  if (Array.isArray(resumeData?.projects)) {
    resumeData.projects.forEach((proj: any, idx: number) => {
      const name = proj.name || "Project";
      const desc = proj.description || "";
      const techs = Array.isArray(proj.technologies) ? proj.technologies.join(", ") : "";
      const text = `Project: ${name}\nTechnologies: ${techs}\nDetails: ${desc}`.trim();

      if (text.length > 15) {
        store.addChunk({
          id: `proj_chunk_${idx + 1}`,
          text,
          source: "resume-project",
          category: "Portfolio & Technical Projects",
          metadata: {
            title: name,
            skills: Array.isArray(proj.technologies) ? proj.technologies : [],
          },
        });
      }
    });
  }

  // 4. Chunk Skills
  const skillsList: string[] = [];
  if (Array.isArray(resumeData?.skills)) {
    resumeData.skills.forEach((s: any) => {
      if (typeof s === "string") skillsList.push(s);
      else if (s?.name) skillsList.push(s.name);
    });
  }
  if (profile?.masterSkills) {
    profile.masterSkills.split(/[,;\n•]+/).forEach((s: string) => {
      if (s.trim()) skillsList.push(s.trim());
    });
  }
  const uniqueSkills = Array.from(new Set(skillsList));
  if (uniqueSkills.length > 0) {
    store.addChunk({
      id: "skills_chunk_all",
      text: `Verified Technical & Professional Skills:\n${uniqueSkills.join(", ")}`,
      source: "resume-skill",
      category: "Technical Competencies",
      metadata: {
        title: "Candidate Skills Matrix",
        skills: uniqueSkills,
      },
    });
  }

  // 5. Chunk Career Goals & Target Roles
  const targetRoles = profile?.targetRoles || (Array.isArray(resumeData?.targetRoles) ? resumeData.targetRoles.join(", ") : "");
  const notes = profile?.careerNotes || resumeData?.basicInfo?.summary || "";
  if (targetRoles || notes) {
    store.addChunk({
      id: "career_goals_chunk",
      text: `Target Career Roles: ${targetRoles}\nCareer Summary & Strategic Notes: ${notes}`.trim(),
      source: "career-notes",
      category: "Career Objectives & Strategy",
      metadata: {
        title: "Career Goals & Notes",
        role: targetRoles,
      },
    });
  }

  return store;
}
