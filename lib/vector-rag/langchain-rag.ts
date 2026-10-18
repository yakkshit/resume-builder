import { VectorRagQueryResult } from "./types";
import { buildPersonalVectorStore } from "./vector-store";

export async function executeLangChainVectorRag(
  query: string,
  resumeData?: any,
  profile?: any,
  memoryVaultMarkdown?: string,
  options?: { topK?: number; minConfidence?: number }
): Promise<VectorRagQueryResult> {
  const store = buildPersonalVectorStore(resumeData, profile, memoryVaultMarkdown);
  const k = options?.topK || 4;
  const results = store.similaritySearchWithScore(query, k, 0.12);

  const topScore = results.length > 0 ? results[0].score : 0;
  const averageConfidence =
    results.length > 0
      ? Math.round(results.reduce((acc, r) => acc + r.confidencePercent, 0) / results.length)
      : 0;

  let confidenceRating: "Very High" | "High" | "Moderate" | "Low" = "Low";
  if (averageConfidence >= 88) confidenceRating = "Very High";
  else if (averageConfidence >= 75) confidenceRating = "High";
  else if (averageConfidence >= 55) confidenceRating = "Moderate";

  const insights: string[] = [];
  if (results.length > 0) {
    const topChunk = results[0];
    insights.push(`Top matching vector passage: "${topChunk.chunk.metadata.title}" (${topChunk.confidencePercent}% confidence).`);
    const uniqueSources = Array.from(new Set(results.map((r) => r.chunk.category)));
    insights.push(`Grounding sources retrieved across: ${uniqueSources.join(", ")}.`);
    insights.push(`Cosine similarity threshold: ${topScore.toFixed(3)} over ${store.getChunksCount()} vector passages.`);
  } else {
    insights.push("No close semantic vector match found above confidence threshold; suggesting broader exploration.");
  }

  const formattedContext = results
    .map(
      (r, i) =>
        `[Passage ${i + 1} | Confidence: ${r.confidencePercent}% | Source: ${r.chunk.category} - ${r.chunk.metadata.title}]:\n${r.chunk.text}`
    )
    .join("\n\n---\n\n");

  const summary = `LangChain Vector RAG Grounding (${results.length} Chunks, Avg Confidence: ${averageConfidence}%):
${formattedContext}`;

  return {
    query,
    topScore,
    averageConfidence,
    confidenceRating,
    retrievedChunks: results,
    summary,
    insights,
    engine: "langchain-vector",
    alternatingEngineAvailable: true,
  };
}
