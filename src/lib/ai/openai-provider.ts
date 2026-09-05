import type { AIProvider, CompletionChunk, CompletionRequest } from "./types";

/**
 * Real OpenAI-backed provider. Only imported/instantiated when
 * OPENAI_API_KEY is present — never bundled into client code (this file is
 * server-only by virtue of only being used from server-side AI service).
 */
export class OpenAIProvider implements AIProvider {
  readonly name = "openai" as const;
  private apiKey: string;
  private chatModel: string;
  private embeddingModel: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || "";
    this.chatModel = process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini";
    this.embeddingModel = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";
  }

  private async getClient() {
    const { default: OpenAI } = await import("openai");
    return new OpenAI({ apiKey: this.apiKey });
  }

  async complete(req: CompletionRequest): Promise<string> {
    const client = await this.getClient();
    const res = await client.chat.completions.create({
      model: this.chatModel,
      messages: req.messages,
      temperature: req.temperature ?? 0.4,
      max_tokens: req.maxTokens ?? 600,
    });
    return res.choices[0]?.message?.content ?? "";
  }

  async *streamComplete(req: CompletionRequest): AsyncGenerator<CompletionChunk> {
    const client = await this.getClient();
    const stream = await client.chat.completions.create({
      model: this.chatModel,
      messages: req.messages,
      temperature: req.temperature ?? 0.4,
      max_tokens: req.maxTokens ?? 600,
      stream: true,
    });
    for await (const part of stream) {
      const delta = part.choices[0]?.delta?.content ?? "";
      if (delta) yield { delta, done: false };
    }
    yield { delta: "", done: true };
  }

  async embed(text: string): Promise<number[]> {
    const client = await this.getClient();
    const res = await client.embeddings.create({ model: this.embeddingModel, input: text });
    return res.data[0].embedding;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const client = await this.getClient();
    const res = await client.embeddings.create({ model: this.embeddingModel, input: texts });
    return res.data.map((d) => d.embedding);
  }
}
