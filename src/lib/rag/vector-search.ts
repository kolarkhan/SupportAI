import "server-only";

/**
 * Vector similarity utilities. Embeddings are stored as native MongoDB
 * `Float[]` arrays on DocumentChunk/FAQ, and similarity search runs
 * in-process (cosine similarity) across a workspace's chunks. At larger
 * scale, swap `topKByCosineSimilarity` for an Atlas Vector Search
 * `$vectorSearch` aggregation stage on the same field — the rest of the
 * RAG pipeline is unchanged.
 */

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

export interface ScoredItem<T> {
  item: T;
  score: number;
}

export function topKByCosineSimilarity<T>(
  queryVector: number[],
  items: { embedding: number[]; data: T }[],
  k: number
): ScoredItem<T>[] {
  const scored = items.map(({ embedding, data }) => ({
    item: data,
    score: cosineSimilarity(queryVector, embedding),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}

/**
 * Kept as thin pass-throughs (rather than inlining `embedding` everywhere)
 * so call sites read the same regardless of storage format — these used to
 * JSON-encode/decode for a text column; native Mongo Float[] needs no
 * conversion at all.
 */
export function parseEmbedding(embedding: number[] | null | undefined): number[] {
  return embedding ?? [];
}

export function encodeEmbedding(vec: number[]): number[] {
  return vec;
}
