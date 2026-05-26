// Ollama provider — local LLM server
// Default: http://localhost:11434/v1
// No API key needed (local).

import type { AiConfig } from './types.js';
import { OpenAICompatibleClient } from './openai-compatible.js';

export class OllamaClient extends OpenAICompatibleClient {
  protected override baseUrl: string;

  constructor(config: AiConfig) {
    super({ ...config, apiKey: config.apiKey || 'ollama' }); // Ollama ignores the key
    this.baseUrl = config.baseUrl ?? 'http://localhost:11434/v1';
  }
}
