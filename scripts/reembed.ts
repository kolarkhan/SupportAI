/* eslint-disable no-console */
/**
 * Re-embeds every existing DocumentChunk and FAQ using whichever embedding
 * backend is currently configured (Voyage AI if VOYAGE_API_KEY is set,
 * otherwise the local hash embedder — see src/lib/ai/embeddings.ts, whose
 * logic this script duplicates rather than imports: that file and its
 * dependencies are guarded with `import "server-only"`, which Next.js
 * resolves via a build-time alias that doesn't exist for a plain script run
 * through tsx — see scripts/seed.ts for the same constraint. Same reason
 * this imports the Pinecone SDK package directly instead of
 * src/lib/rag/pinecone.ts).
 *
 * Why this exists: switching embedding providers (or models) changes the
 * vector space entirely. Cosine similarity between a vector from the old
 * provider and one from the new provider is meaningless — worse, since
 * different models can produce different dimensionalities, comparing them
 * directly would silently compare mismatched vectors instead of erroring,
 * producing bogus scores rather than an obvious failure. Anything embedded
 * before a provider switch needs to be re-embedded so a workspace's vectors
 * are all in the same space again in Pinecone — the only place vectors live;
 * Mongo holds chunk/FAQ text only, never embeddings.
 *
 * Usage:
 *   npx tsx scripts/reembed.ts              # re-embed everything
 *   npx tsx scripts/reembed.ts <workspaceId> # just one workspace
 */
import { PrismaClient } from "@prisma/client";
import { Pinecone } from "@pinecone-database/pinecone";

const prisma = new PrismaClient();
const BATCH_SIZE = 100;
const EMBEDDING_DIMENSIONS = 384;
const PINECONE_INDEX = process.env.PINECONE_INDEX || "supportai";

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

// ── Local Pinecone client (mirrors src/lib/rag/pinecone.ts) ────────────────
// Pinecone is the only vector store now, so this script requires it — there
// is nothing left to re-embed into if it isn't configured.
function getPinecone(): Pinecone {
  if (!process.env.PINECONE_API_KEY) {
    throw new Error("PINECONE_API_KEY is not set — Pinecone is required to re-embed (it's the only vector store).");
  }
  return new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
}

let indexReady: Promise<void> | null = null;
async function ensureIndex(pc: Pinecone, dimension: number): Promise<void> {
  if (!indexReady) {
    indexReady = (async () => {
      const existing = await pc.listIndexes();
      const found = existing.indexes?.some((i) => i.name === PINECONE_INDEX);
      if (!found) {
        console.log(`Pinecone index "${PINECONE_INDEX}" doesn't exist yet — creating it (dimension ${dimension})...`);
        await pc.createIndex({
          name: PINECONE_INDEX,
          dimension,
          metric: "cosine",
          spec: { serverless: { cloud: (process.env.PINECONE_CLOUD || "aws") as "aws" | "gcp" | "azure", region: process.env.PINECONE_REGION || "us-east-1" } },
          waitUntilReady: true,
        });
      }
    })();
  }
  try {
    await indexReady;
  } catch (err) {
    indexReady = null;
    throw err;
  }
}

/** Upserts one batch's worth of records, grouped by workspace since each
 * workspace is its own Pinecone namespace and a single Mongo batch can span
 * several workspaces when re-embedding everything at once. */
async function upsertToPinecone(pc: Pinecone, records: { id: string; workspaceId: string; values: number[]; content: string; documentName: string }[]) {
  if (records.length === 0) return;
  await ensureIndex(pc, records[0].values.length);

  const byWorkspace = new Map<string, typeof records>();
  for (const r of records) {
    const list = byWorkspace.get(r.workspaceId) ?? [];
    list.push(r);
    byWorkspace.set(r.workspaceId, list);
  }

  for (const [workspaceId, group] of byWorkspace) {
    const ns = pc.index(PINECONE_INDEX).namespace(workspaceId);
    await ns.upsert({ records: group.map((r) => ({ id: r.id, values: r.values, metadata: { content: r.content, documentName: r.documentName } })) });
  }
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function reembedChunks(pc: Pinecone, workspaceId?: string) {
  const chunks = await prisma.documentChunk.findMany({
    where: workspaceId ? { workspaceId } : undefined,
    select: { id: true, content: true, workspaceId: true, document: { select: { name: true } } },
  });
  if (chunks.length === 0) {
    console.log("No document chunks to re-embed.");
    return;
  }
  console.log(`Re-embedding ${chunks.length} document chunk(s)...`);
  for (const batch of chunkArray(chunks, BATCH_SIZE)) {
    const vectors = await embedBatch(batch.map((c) => c.content));
    await upsertToPinecone(
      pc,
      batch.map((c, i) => ({ id: c.id, workspaceId: c.workspaceId, values: vectors[i], content: c.content, documentName: c.document.name }))
    );
    console.log(`  ...${batch.length} done`);
  }
}

async function reembedFaqs(pc: Pinecone, workspaceId?: string) {
  const faqs = await prisma.fAQ.findMany({
    where: workspaceId ? { workspaceId, isActive: true } : { isActive: true },
    select: { id: true, question: true, answer: true, workspaceId: true },
  });
  if (faqs.length === 0) {
    console.log("No FAQs to re-embed.");
    return;
  }
  console.log(`Re-embedding ${faqs.length} FAQ(s)...`);
  for (const batch of chunkArray(faqs, BATCH_SIZE)) {
    const contents = batch.map((f) => `Q: ${f.question}\nA: ${f.answer}`);
    const vectors = await embedBatch(contents);
    await upsertToPinecone(
      pc,
      batch.map((f, i) => ({ id: f.id, workspaceId: f.workspaceId, values: vectors[i], content: contents[i], documentName: "FAQ" }))
    );
    console.log(`  ...${batch.length} done`);
  }
}

async function main() {
  const workspaceId = process.argv[2];
  const usingVoyage = !!process.env.VOYAGE_API_KEY;
  console.log(`Embedding backend: ${usingVoyage ? `Voyage AI (${process.env.VOYAGE_EMBEDDING_MODEL || "voyage-3.5"})` : "local hash embedder"}`);
  console.log(`Vector store: Pinecone (${PINECONE_INDEX})`);
  if (workspaceId) console.log(`Scope: workspace ${workspaceId}`);

  const pc = getPinecone();
  await reembedChunks(pc, workspaceId);
  await reembedFaqs(pc, workspaceId);

  console.log("✅ Re-embed complete.");
}

main()
  .catch((err) => {
    console.error("Re-embed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
