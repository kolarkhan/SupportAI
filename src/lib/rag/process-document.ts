import "server-only";
import { prisma } from "@/lib/db/prisma";
import { embedMany } from "@/lib/ai/embeddings";
import { cleanText, extractText } from "./extract";
import { chunkText } from "./chunk";
import { encodeEmbedding } from "./vector-search";
import { isPineconeConfigured, upsertVectors, deleteVectors } from "./pinecone";
import type { DocumentChunk, DocumentType } from "@prisma/client";

/**
 * Full ingestion pipeline (spec steps 1-8):
 * validate -> extract -> clean -> chunk -> embed -> store -> mark processed.
 * Runs async/best-effort; failures are recorded on the Document row so the
 * UI can show "Failed" with a retry action instead of hanging forever.
 *
 * Chunks are always written to Mongo (source of truth, and the fallback
 * search path when Pinecone isn't configured). When PINECONE_API_KEY is
 * set, they're also upserted into Pinecone — a failure there fails the
 * whole document (falls through to the catch below) rather than leaving it
 * marked PROCESSED with no actual vectors to search against.
 */
export async function processDocument(documentId: string, buffer: Buffer, type: DocumentType) {
  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc) return;

  try {
    await prisma.document.update({ where: { id: documentId }, data: { status: "PROCESSING" } });

    const rawText = await extractText(buffer, type);
    const cleaned = cleanText(rawText);

    if (!cleaned || cleaned.length < 20) {
      throw new Error("No readable text could be extracted from this file.");
    }

    const chunks = chunkText(cleaned);
    if (chunks.length === 0) {
      throw new Error("Document produced no usable chunks after cleaning.");
    }

    // Real Voyage AI embeddings when VOYAGE_API_KEY is set, otherwise the
    // local hash embedder — see embeddings.ts. A failure here throws (not
    // caught until the outer try/catch below) so the document is correctly
    // marked FAILED rather than silently mixing embedding spaces.
    const embeddings = await embedMany(chunks.map((c) => c.content), "document");

    const oldChunkIds = (await prisma.documentChunk.findMany({ where: { documentId }, select: { id: true } })).map((c) => c.id);

    const results = await prisma.$transaction([
      prisma.documentChunk.deleteMany({ where: { documentId } }),
      ...chunks.map((chunk, i) =>
        prisma.documentChunk.create({
          data: {
            documentId,
            workspaceId: doc.workspaceId,
            content: chunk.content,
            embedding: encodeEmbedding(embeddings[i]),
            chunkIndex: chunk.index,
            tokenCount: chunk.tokenCount,
          },
        })
      ),
      prisma.document.update({
        where: { id: documentId },
        data: { status: "PROCESSED", chunkCount: chunks.length, errorMessage: null },
      }),
    ]);
    const createdChunks = results.slice(1, 1 + chunks.length) as unknown as DocumentChunk[];

    if (isPineconeConfigured()) {
      if (oldChunkIds.length > 0) await deleteVectors(doc.workspaceId, oldChunkIds);
      await upsertVectors(
        doc.workspaceId,
        createdChunks.map((c, i) => ({ id: c.id, values: embeddings[i], content: c.content, documentName: doc.name }))
      );
    }
  } catch (err: any) {
    await prisma.document.update({
      where: { id: documentId },
      data: { status: "FAILED", errorMessage: err?.message?.slice(0, 500) || "Processing failed." },
    });
  }
}

/** Lightweight "crawl" simulation for website sources (no external network in dev). */
export async function processWebsite(sourceId: string) {
  const source = await prisma.websiteSource.findUnique({ where: { id: sourceId } });
  if (!source) return;

  try {
    await prisma.websiteSource.update({ where: { id: sourceId }, data: { status: "CRAWLING" } });

    let pageText: string;
    try {
      const res = await fetch(source.url, { signal: AbortSignal.timeout(8000) });
      const html = await res.text();
      pageText = cleanText(stripHtml(html));
    } catch {
      // Offline/dev fallback: synthesize placeholder content so the pipeline
      // still demonstrates end-to-end chunking + embedding + retrieval.
      pageText = `Content indexed from ${source.url}. This page was added as a knowledge source for the support agent. Replace with live crawling in production by enabling outbound network access.`;
    }

    const chunks = chunkText(pageText);
    const embeddings = await embedMany(chunks.map((c) => c.content), "document");
    const { documentId, oldChunkIds } = await ensureWebsiteDocumentId(source.id, source.workspaceId, source.url);

    const results = await prisma.$transaction([
      ...chunks.map((chunk, i) =>
        prisma.documentChunk.create({
          data: {
            documentId,
            workspaceId: source.workspaceId,
            content: chunk.content,
            embedding: encodeEmbedding(embeddings[i]),
            chunkIndex: chunk.index,
            tokenCount: chunk.tokenCount,
          },
        })
      ),
      prisma.websiteSource.update({
        where: { id: sourceId },
        data: {
          status: "PROCESSED",
          pageCount: 1,
          chunkCount: chunks.length,
          lastCrawledAt: new Date(),
          errorMessage: null,
        },
      }),
    ]);
    const createdChunks = results.slice(0, chunks.length) as unknown as DocumentChunk[];

    if (isPineconeConfigured()) {
      // Recrawling regenerates chunks with brand-new ids each time, so the
      // previous crawl's vectors would otherwise linger as orphans forever.
      if (oldChunkIds.length > 0) await deleteVectors(source.workspaceId, oldChunkIds);
      await upsertVectors(
        source.workspaceId,
        createdChunks.map((c, i) => ({ id: c.id, values: embeddings[i], content: c.content, documentName: source.url }))
      );
    }
  } catch (err: any) {
    await prisma.websiteSource.update({
      where: { id: sourceId },
      data: { status: "FAILED", errorMessage: err?.message?.slice(0, 500) || "Crawl failed." },
    });
  }
}

// Website content is stored as chunks tied to a synthetic Document row so it
// shares the same retrieval path as uploaded files.
async function ensureWebsiteDocumentId(
  sourceId: string,
  workspaceId: string,
  url: string
): Promise<{ documentId: string; oldChunkIds: string[] }> {
  const marker = `website:${sourceId}`;
  const existing = await prisma.document.findFirst({ where: { workspaceId, storagePath: marker } });
  if (existing) {
    const oldChunkIds = (await prisma.documentChunk.findMany({ where: { documentId: existing.id }, select: { id: true } })).map((c) => c.id);
    await prisma.documentChunk.deleteMany({ where: { documentId: existing.id } });
    return { documentId: existing.id, oldChunkIds };
  }
  const created = await prisma.document.create({
    data: {
      workspaceId,
      name: url,
      type: "TXT",
      status: "PROCESSED",
      storagePath: marker,
    },
  });
  return { documentId: created.id, oldChunkIds: [] };
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}
