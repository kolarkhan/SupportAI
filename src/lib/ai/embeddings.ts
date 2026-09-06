import "server-only";
import { hashEmbedding } from "./mock-provider";
import { isVoyageConfigured, voyageEmbed, voyageEmbedBatch, type VoyageInputType } from "./voyage-provider";

/**
 * Single entry point for every embedding call in the app (document/website
 * ingestion, FAQ indexing, and chat-time query embedding). Deliberately
 * decoupled from the chat AIProviderKind (mock/openai/anthropic) — an
 * agent's chat provider and its embedding backend are independent choices,
 * same as before this existed (ingestion always used the "mock" AIProvider's
 * hash embedder regardless of chat provider). This just upgrades that fixed
 * choice to real Voyage AI embeddings when VOYAGE_API_KEY is configured,
 * falling back to the deterministic local hash otherwise so the product
 * still works fully offline with zero API keys.
 *
 * Errors from Voyage are NOT swallowed here — ingestion callers (which mark
 * the Document/WebsiteSource FAILED with the real error message on any
 * throw) need to know embedding genuinely failed rather than silently
 * mixing real and hash-based vectors in the same workspace, which would
 * silently corrupt cosine-similarity search (see retrieve.ts for the one
 * place that's intentionally lenient — a live chat request shouldn't 500
 * just because embedding one query hiccuped).
 */
export async function embedOne(text: string, inputType: VoyageInputType): Promise<number[]> {
  if (isVoyageConfigured()) return voyageEmbed(text, inputType);
  return hashEmbedding(text);
}

export async function embedMany(texts: string[], inputType: VoyageInputType): Promise<number[][]> {
  if (isVoyageConfigured()) return voyageEmbedBatch(texts, inputType);
  return texts.map((t) => hashEmbedding(t));
}
