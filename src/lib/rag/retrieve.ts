import "server-only";
import { embedOne } from "@/lib/ai/embeddings";
import { hashEmbedding } from "@/lib/ai/mock-provider";
import { queryVectors, type QueryMatch } from "./pinecone";

export interface RetrievedSource {
  documentName: string;
  snippet: string;
  score: number;
}

const TOP_K = 4;
const MIN_SCORE = 0.12; // below this, treat as "no relevant context"

/**
 * Chat-time RAG steps: embed the customer question, run similarity search
 * across the workspace's document chunks + FAQs in Pinecone, and return the
 * top matches plus a best-effort confidence score.
 *
 * Pinecone is the only vector store — Mongo holds no embeddings — so a
 * Pinecone failure at query time (not configured, transient network issue,
 * etc.) can't fall back to a local search; it degrades to "no relevant
 * context found" instead. That's a worse answer for that one message, but
 * it still can't 500 a live customer chat request.
 */
export async function retrieveContext(workspaceId: string, question: string) {
  // A failed query embedding must not 500 the customer's live chat request
  // — fall back to the local hash embedder for this one query rather than
  // throwing. (It'll score badly against Voyage-embedded chunks since
  // they're different vector spaces, but that just means a low-confidence/
  // no-match result, not a broken chat.)
  const queryVector = await embedOne(question, "query").catch((err) => {
    console.error("Query embedding failed, falling back to local hash embedder:", err);
    return hashEmbedding(question);
  });

  try {
    const matches = await queryVectors(workspaceId, queryVector, TOP_K);
    return buildResult(matches.map((m) => ({ item: m, score: m.score })));
  } catch (err) {
    console.error("Pinecone query failed — returning no context for this message:", err);
    return { sources: [] as RetrievedSource[], confidence: 0, contextText: "" };
  }
}

function buildResult(top: { item: QueryMatch; score: number }[]) {
  const relevant = top.filter((t) => t.score >= MIN_SCORE);

  const sources: RetrievedSource[] = relevant.map((r) => ({
    documentName: r.item.documentName,
    snippet: r.item.content.slice(0, 280),
    score: Math.round(r.score * 100) / 100,
  }));

  const confidence = relevant.length > 0 ? Math.min(0.98, relevant[0].score + relevant.length * 0.05) : 0;

  const contextText = relevant.map((r, i) => `[Source ${i + 1}: ${r.item.documentName}]\n${r.item.content}`).join("\n\n");

  return { sources, confidence, contextText };
}
