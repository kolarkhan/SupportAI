import "server-only";
import type { AIProviderKind } from "@prisma/client";
import type { AIProvider } from "./types";
import { MockProvider } from "./mock-provider";

export type { AIProvider, ChatMessage, CompletionChunk, CompletionRequest } from "./types";

let mockSingleton: AIProvider | null = null;

/**
 * Provider factory. Resolves which concrete implementation to use based on
 * the agent's configured provider and available API keys, always falling
 * back to the mock provider so the product never hard-fails without keys.
 */
export async function getAIProvider(kind?: AIProviderKind | string | null): Promise<AIProvider> {
  const requested = (kind || process.env.DEFAULT_AI_PROVIDER || "mock").toString().toLowerCase();

  if (requested === "openai" && process.env.OPENAI_API_KEY) {
    const { OpenAIProvider } = await import("./openai-provider");
    return new OpenAIProvider();
  }

  if (requested === "anthropic" && process.env.ANTHROPIC_API_KEY) {
    const { AnthropicProvider } = await import("./anthropic-provider");
    return new AnthropicProvider();
  }

  if (!mockSingleton) mockSingleton = new MockProvider();
  return mockSingleton;
}
