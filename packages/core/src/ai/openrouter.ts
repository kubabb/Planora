// OpenRouter provider — https://openrouter.ai
// API key prefix: sk-or-v1-...

import type { AiConfig } from './types.js';
import { OpenAICompatibleClient } from './openai-compatible.js';

export class OpenRouterClient extends OpenAICompatibleClient {
  protected override baseUrl = 'https://openrouter.ai/api/v1';

  constructor(config: AiConfig) {
    super(config);
    this.extraHeaders = {
      'HTTP-Referer': 'https://planora.dev',
      'X-Title': 'Planora',
    };
  }
}
