// AiClient interface — the main contract for all LLM providers

import type {
  AiConfigOverrides,
  AiConnectionTest,
  AiMessage,
  AiResponse,
  AiStreamEvent,
  AiTool,
} from './types.js';

/**
 * AiClient — bezpośredni klient LLM.
 * Wszystkie implementacje (OpenRouter, OpenAI, Ollama, OpenCode)
 * implementują ten interfejs.
 */
export interface AiClient {
  /** Generuje odpowiedź tekstową (bez tool calling) */
  generate(
    messages: AiMessage[],
    config?: AiConfigOverrides,
  ): Promise<AiResponse>;

  /** Generuje z obsługą function-calling */
  generateWithTools(
    messages: AiMessage[],
    tools: AiTool[],
    config?: AiConfigOverrides,
  ): Promise<AiResponse>;

  /** Generuje structured output (JSON Schema) */
  generateStructured<T>(
    messages: AiMessage[],
    schema: Record<string, unknown>,
    config?: AiConfigOverrides,
  ): Promise<T>;

  /** Generuje streaming (async iterable) */
  generateStream(
    messages: AiMessage[],
    config?: AiConfigOverrides,
  ): AsyncIterable<AiStreamEvent>;

  /** Testuje połączenie z providerem */
  testConnection(): Promise<AiConnectionTest>;
}
