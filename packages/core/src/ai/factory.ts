// AiClient factory — creates the right client based on provider

import type { AiClient } from './client';
import type { AiConfig } from './types';
import { OpenRouterClient } from './openrouter';
import { OpenAIClient } from './openai';
import { OllamaClient } from './ollama';
import { OpenCodeClient } from './opencode';
import { OpenAICompatibleClient } from './openai-compatible';
import { AiError } from './errors';

/**
 * createAiClient — factory for AiClient instances.
 *
 * Detects provider from config and returns the appropriate implementation.
 * For 'openai-compatible' provider, baseUrl is REQUIRED.
 *
 * Auto-detection: if apiKey starts with 'sk-or-v1-', forces OpenRouter.
 */
export function createAiClient(config: AiConfig): AiClient {
  // Auto-detect OpenRouter key
  if (config.apiKey?.startsWith('sk-or-v1-') && config.provider !== 'openai') {
    return new OpenRouterClient({ ...config, provider: 'openrouter' });
  }

  switch (config.provider) {
    case 'openrouter':
      return new OpenRouterClient(config);
    case 'openai':
      return new OpenAIClient(config);
    case 'ollama':
      return new OllamaClient(config);
    case 'opencode':
      return new OpenCodeClient(config);
    case 'openai-compatible': {
      if (!config.baseUrl) {
        throw new AiError(
          'baseUrl is required for openai-compatible provider',
          undefined,
          'openai-compatible',
        );
      }
      // Generic client
      return new (class extends OpenAICompatibleClient {
        protected override baseUrl: string = config.baseUrl!;
      })(config);
    }
    default:
      throw new AiError(
        `Unknown provider: ${config.provider}`,
        undefined,
        config.provider,
      );
  }
}
