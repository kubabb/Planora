// Direct OpenAI provider — https://api.openai.com

import type { AiConfig } from './types';
import { OpenAICompatibleClient } from './openai-compatible';

export class OpenAIClient extends OpenAICompatibleClient {
  protected override baseUrl = 'https://api.openai.com/v1';

  constructor(config: AiConfig) {
    super(config);
  }
}
