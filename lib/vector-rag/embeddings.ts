import { EmbeddingOptions } from "./types";

const VECTOR_DIMENSION = 256;

/**
 * Hash a string to a 32-bit unsigned integer using FNV-1a.
 */
function fnv1aHash(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return hash >>> 0;
}

/**
 * Generate a dense semantic vector embedding for text.
 * Uses subword tokens, character 3-grams, and word frequencies, mapped into a 256-dim space with L2 normalization.
 */
export function generateLocalEmbedding(text: string): number[] {
  const vector = new Array(VECTOR_DIMENSION).fill(0);
  const clean = (text || "").toLowerCase().trim();
  if (!clean) return vector;

  // 1. Word token frequencies
  const words = clean.split(/[^a-z0-9_#+.-]+/i).filter((w) => w.length > 1);
  for (const word of words) {
    const idx = fnv1aHash(word) % VECTOR_DIMENSION;
    vector[idx] += 2.0;

    // Subword character trigrams for typo-tolerance & morphology matching
    if (word.length >= 3) {
      for (let i = 0; i <= word.length - 3; i++) {
        const tri = word.slice(i, i + 3);
        const triIdx = fnv1aHash(`tri_${tri}`) % VECTOR_DIMENSION;
        vector[triIdx] += 0.75;
      }
    }
  }

  // 2. Bigrams for phrase semantics
  for (let i = 0; i < words.length - 1; i++) {
    const bigram = `${words[i]}_${words[i + 1]}`;
    const biIdx = fnv1aHash(`bi_${bigram}`) % VECTOR_DIMENSION;
    vector[biIdx] += 1.5;
  }

  // 3. L2 Normalization (unit vector)
  let norm = 0;
  for (let i = 0; i < VECTOR_DIMENSION; i++) {
    norm += vector[i] * vector[i];
  }
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < VECTOR_DIMENSION; i++) {
      vector[i] /= norm;
    }
  }

  return vector;
}

/**
 * Calculate Cosine Similarity between two normalized vectors.
 * Returns value between 0.0 and 1.0.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    const a = vecA[i];
    const b = vecB[i];
    dotProduct += a * b;
    normA += a * a;
    normB += b * b;
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  const sim = dotProduct / denominator;
  // Bound within 0.0 and 1.0
  return Math.max(0, Math.min(1, sim));
}

/**
 * Get embeddings for a text, with cloud provider support and fallback to local semantic vectors.
 */
export async function getEmbedding(text: string, options?: EmbeddingOptions): Promise<number[]> {
  // If OpenAI API Key is provided, attempt remote dense embedding
  if (options?.openAiApiKey) {
    try {
      const res = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${options.openAiApiKey}`,
        },
        body: JSON.stringify({
          model: "text-embedding-3-small",
          input: text.slice(0, 8000),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.data?.[0]?.embedding) {
          return data.data[0].embedding;
        }
      }
    } catch {
      // Fallback to local
    }
  }

  return generateLocalEmbedding(text);
}
