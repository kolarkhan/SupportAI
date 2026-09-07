import "server-only";
import { Pinecone } from "@pinecone-database/pinecone";

/**
 * Real vector database (Pinecone) for RAG retrieval, used instead of the
 * brute-force in-process cosine similarity in vector-search.ts when
 * PINECONE_API_KEY is configured. MongoDB stays the source of truth for the
 * actual chunk/FAQ content (relationships, workspace ownership, etc.) —
 * Pinecone only holds the embedding + just enough metadata (content,
 * documentName) to build an answer directly from its query response,
 * without a second round-trip to Mongo on the hot chat-query path.
 *
 * Multi-tenant isolation: each workspace gets its own Pinecone *namespace*
 * (not just a metadata filter) — namespaces are a hard partition Pinecone
 * enforces itself, so a bug that forgets to filter can't leak another
 * workspace's vectors the way a missed `where` clause could with Mongo.
 *
 * Every record's id is the same id as its MongoDB row (DocumentChunk.id or
 * FAQ.id) — that's what makes updates/deletes a direct 1:1 operation instead
 * of needing a separate mapping table.
 */
const INDEX_NAME = process.env.PINECONE_INDEX || "supportai";
const CLOUD = (process.env.PINECONE_CLOUD || "aws") as "aws" | "gcp" | "azure";
const REGION = process.env.PINECONE_REGION || "us-east-1";

export function isPineconeConfigured(): boolean {
  return !!process.env.PINECONE_API_KEY;
}

let client: Pinecone | null = null;
function getClient(): Pinecone {
  if (!client) client = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
  return client;
}

// Cached across calls in the same process so we don't re-check "does the
// index exist" on every single upsert — only the first one per cold start.
let indexReady: Promise<void> | null = null;
async function ensureIndex(dimension: number): Promise<void> {
  if (!indexReady) {
    indexReady = (async () => {
      const pc = getClient();
      const existing = await pc.listIndexes();
      const found = existing.indexes?.some((i) => i.name === INDEX_NAME);
      if (!found) {
        await pc.createIndex({
          name: INDEX_NAME,
          dimension,
          metric: "cosine",
          spec: { serverless: { cloud: CLOUD, region: REGION } },
          waitUntilReady: true,
        });
      }
    })();
  }
  try {
    await indexReady;
  } catch (err) {
    indexReady = null; // let the next call retry instead of caching a failure forever
    throw err;
  }
}

export interface VectorRecord {
  id: string;
  values: number[];
  content: string;
  documentName: string;
}

/** Create/update vectors. Auto-creates the index on first use (dimension is
 * whatever the caller's embedding provider actually produced — see
 * embeddings.ts — so this adapts to Voyage AI or the local hash embedder
 * without hardcoding a dimension). */
export async function upsertVectors(workspaceId: string, records: VectorRecord[]): Promise<void> {
  if (records.length === 0) return;
  await ensureIndex(records[0].values.length);
  const pc = getClient();
  const ns = pc.index(INDEX_NAME).namespace(workspaceId);
  await ns.upsert({
    records: records.map((r) => ({
      id: r.id,
      values: r.values,
      metadata: { content: r.content, documentName: r.documentName },
    })),
  });
}

export async function deleteVectors(workspaceId: string, ids: string[]): Promise<void> {
  if (ids.length === 0 || !isPineconeConfigured()) return;
  const pc = getClient();
  const ns = pc.index(INDEX_NAME).namespace(workspaceId);
  await ns.deleteMany({ ids });
}

export interface QueryMatch {
  documentName: string;
  content: string;
  score: number;
}

export async function queryVectors(workspaceId: string, queryVector: number[], topK: number): Promise<QueryMatch[]> {
  const pc = getClient();
  const ns = pc.index(INDEX_NAME).namespace(workspaceId);
  const res = await ns.query({ vector: queryVector, topK, includeMetadata: true });
  return (res.matches ?? []).map((m) => ({
    documentName: (m.metadata?.documentName as string | undefined) ?? "Unknown",
    content: (m.metadata?.content as string | undefined) ?? "",
    score: m.score ?? 0,
  }));
}
