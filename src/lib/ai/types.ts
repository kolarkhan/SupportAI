export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface CompletionRequest {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
}

export interface CompletionChunk {
  delta: string;
  done: boolean;
}

/**
 * Provider-agnostic interface. Every concrete provider (OpenAI, Anthropic,
 * Mock) implements this so the rest of the app never imports a vendor SDK
 * directly. This is what makes SupportAI provider-agnostic.
 */
export interface AIProvider {
  readonly name: "mock" | "openai" | "anthropic";
  /** Non-streaming completion — used for internal tasks (confidence scoring, etc). */
  complete(req: CompletionRequest): Promise<string>;
  /** Streaming completion — used for the live chat UI. */
  streamComplete(req: CompletionRequest): AsyncGenerator<CompletionChunk>;
  /** Turns text into a fixed-length embedding vector. */
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}

export const EMBEDDING_DIMENSIONS = 384;
