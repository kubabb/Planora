// Config validator — validates Planora config and tests provider connection

import type { AiClient } from '../ai/client';
import type { AiConfig } from '../ai/types';
import { createAiClient } from '../ai/factory';
import type { PlanoraConfig } from './types';
import { getActiveProvider } from './loader';

export interface ConfigValidationResult {
  valid: boolean;
  errors: string[];
  connectionTest?: {
    ok: boolean;
    model: string;
    latency: number;
    error?: string;
  };
}

/** Validate config structure (no connection test) */
export function validateConfig(config: PlanoraConfig): ConfigValidationResult {
  const errors: string[] = [];

  if (!config.version || config.version !== 1) {
    errors.push('config.version must be 1');
  }

  if (!config.providers || Object.keys(config.providers).length === 0) {
    errors.push('No providers configured. Run `planora config` to set up.');
  }

  for (const [key, provider] of Object.entries(config.providers)) {
    if (!provider.apiKey || provider.apiKey.trim() === '') {
      errors.push(`Provider "${key}" has no apiKey`);
    }
    if (!provider.model || provider.model.trim() === '') {
      errors.push(`Provider "${key}" has no model`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/** Validate config AND test connection to the active provider */
export async function validateAndTest(config: PlanoraConfig): Promise<ConfigValidationResult> {
  const result = validateConfig(config);
  if (!result.valid) return result;

  const provider = getActiveProvider(config);
  if (!provider) {
    result.errors.push('No active provider found');
    result.valid = false;
    return result;
  }

  const aiConfig: AiConfig = {
    provider: 'openrouter', // will be auto-detected
    apiKey: provider.apiKey,
    model: provider.model,
    baseUrl: provider.baseUrl,
    temperature: provider.temperature,
    maxTokens: provider.maxTokens,
    timeout: 15000,
  };

  try {
    const client: AiClient = createAiClient(aiConfig);
    const test = await client.testConnection();
    result.connectionTest = test;
    if (!test.ok) {
      result.errors.push(`Connection failed: ${test.error}`);
      result.valid = false;
    }
  } catch (error) {
    result.connectionTest = {
      ok: false,
      model: provider.model,
      latency: 0,
      error: error instanceof Error ? error.message : String(error),
    };
    result.errors.push(`Connection error: ${result.connectionTest.error}`);
    result.valid = false;
  }

  return result;
}
