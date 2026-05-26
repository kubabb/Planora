// @planora/core — ai module barrel

export type {
  AiProvider,
  AiConfig,
  AiConfigOverrides,
  AiMessage,
  AiToolCall,
  AiTool,
  AiResponse,
  AiUsage,
  AiStreamEvent,
  AiConnectionTest,
} from './types.js';

export type { AiClient } from './client.js';

export {
  AiError,
  AuthError,
  RateLimitError,
  TimeoutError,
  ServerError,
  InvalidResponseError,
} from './errors.js';

export { withRetry, isRetryable, calcDelay } from './retry.js';

export { OpenAICompatibleClient } from './openai-compatible.js';
export { OpenRouterClient } from './openrouter.js';
export { OpenAIClient } from './openai.js';
export { OllamaClient } from './ollama.js';
export { OpenCodeClient } from './opencode.js';
export { createAiClient } from './factory.js';
