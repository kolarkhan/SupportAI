import type { AIProvider, ChatMessage, CompletionChunk, CompletionRequest } from "./types";
import { hashEmbedding } from "./mock-provider";

/**
 * Real Anthropic-backed provider. Claude models don't expose a first-party
 * embeddings endpoint, so embeddings fall back to the same deterministic
 * hashing scheme used by MockProvider — chat quality still comes from the
 * real Claude model, only the vector-search step stays local.
 */
export class AnthropicProvider implements AIProvider {
  readonly name = "anthropic" as const;
  private apiKey: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY || "";
    this.model = process.env.ANTHROPIC_CHAT_MODEL || "claude-3-5-sonnet-latest";
  }

  private async getClient() {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    return new Anthropic({ apiKey: this.apiKey });
  }

  private splitSystem(messages: ChatMessage[]) {
    const system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
    const rest = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
    return { system, rest };
  }

  async complete(req: CompletionRequest): Promise<string> {
    const client = await this.getClient();
    const { system, rest } = this.splitSystem(req.messages);
    const res = await client.messages.create({
      model: this.model,
      system,
      messages: rest,
      max_tokens: req.maxTokens ?? 600,
      temperature: req.temperature ?? 0.4,
    });
    const block = res.content[0];
    return block?.type === "text" ? block.text : "";
  }

  async *streamComplete(req: CompletionRequest): AsyncGenerator<CompletionChunk> {
    const client = await this.getClient();
    const { system, rest } = this.splitSystem(req.messages);
    const stream = client.messages.stream({
      model: this.model,
      system,
      messages: rest,
      max_tokens: req.maxTokens ?? 600,
      temperature: req.temperature ?? 0.4,
    });
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        yield { delta: event.delta.text, done: false };
      }
    }
    yield { delta: "", done: true };
  }

  async embed(text: string): Promise<number[]> {
    return hashEmbedding(text);
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return texts.map((t) => hashEmbedding(t));
  }
}
