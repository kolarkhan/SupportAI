/* eslint-disable no-console */
/**
 * Re-embeds every existing DocumentChunk and FAQ using whichever embedding
 * backend is currently configured (Voyage AI if VOYAGE_API_KEY is set,
 * otherwise the local hash embedder — see src/lib/ai/embeddings.ts, whose
 * logic this script duplicates rather than imports: that file and its
 * dependencies are guarded with `import "server-only"`, which Next.js
 * resolves via a build-time alias that doesn't exist for a plain script run
 * through tsx — see scripts/seed.ts for the same constraint).
 *
 * Why this exists: switching embedding providers (or models) changes the
 * vector space entirely. Cosine similarity between a vector from the old
 * provider and one from the new provider is meaningless — worse, since
 * different models can produce different dimensionalities,
 * `cosineSimilarity`'s length-truncation would silently compare a slice of
 * one vector against a slice of the other rather than erroring, producing
 * bogus scores instead of an obvious failure. Anything embedded before a
 * provider switch needs to be re-embedded so a workspace's vectors are all
 * in the same space again.
 *
 * Usage:
 *   npx tsx scripts/reembed.ts              # re-embed everything
 *   npx tsx scripts/reembed.ts <workspaceId> # just one workspace
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BATCH_SIZE = 100;
const EMBEDDING_DIMENSIONS = 384;

// ── Local hash embedder (mirrors src/lib/ai/mock-provider.ts) ──────────────
function hashString(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}
function hashEmbedding(text: string, dims = EMBEDDING_DIMENSIONS): number[] {
  const vec = new Array(dims).fill(0);
  const tokens = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((t) => t.length > 1);
  for (const token of tokens) {
    const h = hashString(token);
    vec[h % dims] += 1;
    vec[(h * 31) % dims] += 0.35;
  }
  const mag = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / mag);
}

// ── Local Voyage AI client (mirrors src/lib/ai/voyage-provider.ts) ─────────
async function voyageEmbedBatch(texts: string[], apiKey: string, model: string): Promise<number[][]> {
  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ input: texts, model, input_type: "document" }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Voyage AI embedding request failed (${res.status}): ${body.slice(0, 300) || res.statusText}`);
  }
  const json = (await res.json()) as { data: { embedding: number[]; index: number }[] };
  return [...json.data].sort((a, b) => a.index - b.index).map((d) => d.embedding);
}

async function embedBatch(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (apiKey) return voyageEmbedBatch(texts, apiKey, process.env.VOYAGE_EMBEDDING_MODEL || "voyage-3.5");
  return texts.map((t) => hashEmbedding(t));
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function reembedChunks(workspaceId?: string) {
  const chunks = await prisma.documentChunk.findMany({
    where: workspaceId ? { workspaceId } : undefined,
    select: { id: true, content: true },
  });
  if (chunks.length === 0) {
    console.log("No document chunks to re-embed.");
    return;
  }
  console.log(`Re-embedding ${chunks.length} document chunk(s)...`);
  for (const batch of chunkArray(chunks, BATCH_SIZE)) {
    const vectors = await embedBatch(batch.map((c) => c.content));
    await prisma.$transaction(batch.map((c, i) => prisma.documentChunk.update({ where: { id: c.id }, data: { embedding: vectors[i] } })));
    console.log(`  ...${batch.length} done`);
  }
}

async function reembedFaqs(workspaceId?: string) {
  const faqs = await prisma.fAQ.findMany({
    where: workspaceId ? { workspaceId } : undefined,
    select: { id: true, question: true, answer: true },
  });
  if (faqs.length === 0) {
    console.log("No FAQs to re-embed.");
    return;
  }
  console.log(`Re-embedding ${faqs.length} FAQ(s)...`);
  for (const batch of chunkArray(faqs, BATCH_SIZE)) {
    const vectors = await embedBatch(batch.map((f) => `Q: ${f.question}\nA: ${f.answer}`));
    await prisma.$transaction(batch.map((f, i) => prisma.fAQ.update({ where: { id: f.id }, data: { embedding: vectors[i] } })));
    console.log(`  ...${batch.length} done`);
  }
}

async function main() {
  const workspaceId = process.argv[2];
  const usingVoyage = !!process.env.VOYAGE_API_KEY;
  console.log(`Embedding backend: ${usingVoyage ? `Voyage AI (${process.env.VOYAGE_EMBEDDING_MODEL || "voyage-3.5"})` : "local hash embedder"}`);
  if (workspaceId) console.log(`Scope: workspace ${workspaceId}`);

  await reembedChunks(workspaceId);
  await reembedFaqs(workspaceId);

  console.log("✅ Re-embed complete.");
}

main()
  .catch((err) => {
    console.error("Re-embed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
