import "server-only";

/**
 * Voyage AI embeddings — Anthropic's recommended embedding provider (Claude
 * itself has no first-party embeddings endpoint, which is why
 * anthropic-provider.ts previously fell back to the local hash scheme for
 * embeddings even when using real Claude for chat). This is embeddings-only:
 * Voyage doesn't do chat completion, so it isn't a full AIProvider — it's
 * consumed through embeddings.ts instead, which is what the RAG pipeline
 * actually calls.
 */
const VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings";

export type VoyageInputType = "document" | "query";

interface VoyageResponse {
  data: { embedding: number[]; index: number }[];
}

function getConfig() {
  const apiKey = process.env.VOYAGE_API_KEY || "";
  const model = process.env.VOYAGE_EMBEDDING_MODEL || "voyage-3.5";
  return { apiKey, model };
}

export function isVoyageConfigured(): boolean {
  return getConfig().apiKey.length > 0;
}

async function callVoyage(input: string[], inputType: VoyageInputType): Promise<number[][]> {
  const { apiKey, model } = getConfig();
  if (!apiKey) throw new Error("VOYAGE_API_KEY is not set.");

  const res = await fetch(VOYAGE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ input, model, input_type: inputType }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Voyage AI embedding request failed (${res.status}): ${body.slice(0, 300) || res.statusText}`);
  }

  const json = (await res.json()) as VoyageResponse;
  // Response order should already match input order, but sort by index defensively.
  return [...json.data].sort((a, b) => a.index - b.index).map((d) => d.embedding);
}

/** `inputType` matters for retrieval quality: Voyage embeds queries and documents
 * asymmetrically — "document" for content being indexed, "query" for the
 * search text at retrieval time. */
export async function voyageEmbed(text: string, inputType: VoyageInputType): Promise<number[]> {
  const [vec] = await callVoyage([text], inputType);
  return vec;
}

export async function voyageEmbedBatch(texts: string[], inputType: VoyageInputType): Promise<number[][]> {
  if (texts.length === 0) return [];
  return callVoyage(texts, inputType);
}
