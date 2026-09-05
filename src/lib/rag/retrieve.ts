import "server-only";
import { prisma } from "@/lib/db/prisma";
import { getAIProvider } from "@/lib/ai";
import { parseEmbedding, topKByCosineSimilarity } from "./vector-search";

export interface RetrievedSource {
  documentName: string;
  snippet: string;
  score: number;
}

const TOP_K = 4;
const MIN_SCORE = 0.12; // below this, treat as "no relevant context"

/**
 * Chat-time RAG steps: embed the customer question, run similarity search
 * across the workspace's document chunks + FAQs, and return the top
 * matches plus a best-effort confidence score.
 */
export async function retrieveContext(workspaceId: string, question: string) {
  const provider = await getAIProvider("mock");
  const queryVector = await provider.embed(question);

  const [chunks, faqs] = await Promise.all([
    prisma.documentChunk.findMany({
      where: { workspaceId },
      include: { document: { select: { name: true } } },
      take: 4000,
    }),
    prisma.fAQ.findMany({ where: { workspaceId, isActive: true } }),
  ]);

  const chunkCandidates = chunks.map((c) => ({
    embedding: parseEmbedding(c.embedding),
    data: { name: c.document.name, content: c.content } as { name: string; content: string },
  }));

  const faqCandidates = faqs
    .filter((f) => f.embedding && f.embedding.length > 0)
    .map((f) => ({
      embedding: parseEmbedding(f.embedding),
      data: { name: "FAQ", content: `Q: ${f.question}\nA: ${f.answer}` },
    }));

  const all = [...chunkCandidates, ...faqCandidates];
  if (all.length === 0) {
    return { sources: [] as RetrievedSource[], confidence: 0, contextText: "" };
  }

  const top = topKByCosineSimilarity(queryVector, all, TOP_K);
  const relevant = top.filter((t) => t.score >= MIN_SCORE);

  const sources: RetrievedSource[] = relevant.map((r) => ({
    documentName: r.item.name,
    snippet: r.item.content.slice(0, 280),
    score: Math.round(r.score * 100) / 100,
  }));

  const confidence = relevant.length > 0 ? Math.min(0.98, relevant[0].score + relevant.length * 0.05) : 0;

  const contextText = relevant.map((r, i) => `[Source ${i + 1}: ${r.item.name}]\n${r.item.content}`).join("\n\n");

  return { sources, confidence, contextText };
}
