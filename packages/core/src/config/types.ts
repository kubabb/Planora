// Planora config types — user config stored in ~/.planora/config.json

import type { AiProvider } from '../ai/types';

export interface PlanoraConfig {
  version: 1;
  providers: Record<string, ProviderConfig>;
  preferences: UserPreferences;
}

export interface ProviderConfig {
  apiKey: string;
  model: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface UserPreferences {
  language: 'pl' | 'en';
  autoApprove: boolean;
  maxSteps: number;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  language: 'pl',
  autoApprove: false,
  maxSteps: 10,
};

/** The default provider key */
export const DEFAULT_PROVIDER_KEY = 'default';

/** Safe-to-display config (masks apiKey) */
export interface SafeConfig {
  providers: Record<string, Omit<ProviderConfig, 'apiKey'> & { apiKey: string }>;
  preferences: UserPreferences;
}

export function maskApiKey(key: string): string {
  if (key.length <= 8) return '****';
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

export function redactConfig(config: PlanoraConfig): SafeConfig {
  return {
    providers: Object.fromEntries(
      Object.entries(config.providers).map(([k, v]) => [
        k,
        { ...v, apiKey: maskApiKey(v.apiKey) },
      ]),
    ),
    preferences: config.preferences,
  };
}
