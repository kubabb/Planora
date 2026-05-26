// OpenCode provider — https://opencode.ai
// OpenAI-compatible API.

import type { AiConfig } from './types.js';
import { OpenAICompatibleClient } from './openai-compatible.js';

export class OpenCodeClient extends OpenAICompatibleClient {
  protected override baseUrl = 'https://api.opencode.ai/v1';

  constructor(config: AiConfig) {
    super(config);
  }
}
