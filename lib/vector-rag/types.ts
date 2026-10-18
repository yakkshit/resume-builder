export interface VectorDocumentChunk {
  id: string;
  text: string;
  source: "memory-vault" | "resume-basic" | "resume-experience" | "resume-project" | "resume-skill" | "resume-education" | "career-notes";
  category: string;
  metadata: {
    title: string;
    section?: string;
    skills?: string[];
    role?: string;
    company?: string;
    timestamp?: string;
  };
  embedding?: number[];
}

export interface SimilaritySearchResult {
  chunk: VectorDocumentChunk;
  score: number; // 0.0 - 1.0 (cosine similarity)
  confidencePercent: number; // 0 - 100%
  rank: number;
}

export interface VectorRagQueryResult {
  query: string;
  topScore: number;
  averageConfidence: number;
  confidenceRating: "Very High" | "High" | "Moderate" | "Low";
  retrievedChunks: SimilaritySearchResult[];
  summary: string;
  insights: string[];
  engine: "langchain-vector";
  alternatingEngineAvailable: boolean; // Tells UI user can alternate with Neo4j Graphical RAG
}

export interface EmbeddingOptions {
  openAiApiKey?: string;
  googleApiKey?: string;
}
