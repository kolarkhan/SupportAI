import type { AIProvider, ChatMessage, CompletionChunk, CompletionRequest } from "./types";
import { EMBEDDING_DIMENSIONS } from "./types";

/**
 * Deterministic, dependency-free AI provider used when no API key is
 * configured. It performs a lightweight retrieval-aware response so the
 * whole product (RAG pipeline, chat UI, streaming, confidence, escalation)
 * is fully demoable with zero external calls or cost.
 *
 * Embeddings are a deterministic bag-of-words hashing scheme (not a real
 * semantic model) but behave correctly for the vector-search plumbing:
 * similar wording -> similar vectors -> cosine similarity retrieval works.
 */
export class MockProvider implements AIProvider {
  readonly name = "mock" as const;

  async complete(req: CompletionRequest): Promise<string> {
    const chunks: string[] = [];
    for await (const c of this.streamComplete(req)) chunks.push(c.delta);
    return chunks.join("");
  }

  async *streamComplete(req: CompletionRequest): AsyncGenerator<CompletionChunk> {
    const text = generateMockAnswer(req.messages);
    // Simulate token-by-token streaming.
    const words = text.split(/(\s+)/);
    for (const w of words) {
      yield { delta: w, done: false };
      await sleep(8 + Math.random() * 12);
    }
    yield { delta: "", done: true };
  }

  async embed(text: string): Promise<number[]> {
    return hashEmbedding(text);
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return texts.map(hashEmbedding);
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Simple, fast, deterministic hashing embedding (bag-of-words -> fixed vector). */
export function hashEmbedding(text: string, dims = EMBEDDING_DIMENSIONS): number[] {
  const vec = new Array(dims).fill(0);
  const tokens = normalize(text);
  for (const token of tokens) {
    const h = hashString(token);
    const idx = h % dims;
    vec[idx] += 1;
    // Add a secondary, more diffuse signal so single-word overlap still helps
    // similarity without making every vector collide on one bucket.
    const idx2 = (h * 31) % dims;
    vec[idx2] += 0.35;
  }
  return normalizeVector(vec);
}

function normalize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

function hashString(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

function normalizeVector(vec: number[]): number[] {
  const mag = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / mag);
}

/**
 * Builds a plausible, grounded-sounding response from the retrieved context
 * that was already injected into the system prompt by the RAG pipeline.
 * This keeps the demo experience coherent without any external AI call.
 */
function generateMockAnswer(messages: ChatMessage[]): string {
  const system = messages.find((m) => m.role === "system")?.content ?? "";

  const contextMatch = system.match(/<retrieved_context>([\s\S]*?)<\/retrieved_context>/);
  const context = contextMatch?.[1]?.trim() ?? "";
  const noInfoMatch = system.includes("NO_MATCHING_CONTEXT");

  if (!context || noInfoMatch) {
    return "I don't have enough information to answer that accurately. Would you like me to connect you with a support specialist?";
  }

  // Pull the most relevant-looking sentence(s) from context as a grounded answer.
  // Strip the "[Source N: name]" label line and, for FAQ-shaped snippets, the
  // "Q: ...\nA: ..." framing — those are retrieval metadata/formatting, not
  // part of the answer, and would otherwise leak verbatim into the reply.
  const firstBlock = (context.split(/\n\s*\n/)[0] || context)
    .replace(/^\[Source \d+:[^\]]*\]\s*/, "")
    .replace(/^Q:[\s\S]*\nA:\s*/, "");
  const sentences = firstBlock
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);

  const answer = sentences.join(" ") || firstBlock.slice(0, 320);

  const opener = pick([
    "Happy to help with that.",
    "Sure, here's what I found for you.",
    "Good question — here's the answer based on our documentation.",
  ]);

  return `${opener} ${answer}`.trim();
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
