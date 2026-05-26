// Config tests

import { describe, it, expect } from 'vitest';
import { validateConfig, redactConfig, maskApiKey } from '../src/config/index.js';
import type { PlanoraConfig } from '../src/config/types.js';

describe('config', () => {
  describe('maskApiKey', () => {
    it('masks long key', () => {
      const result = maskApiKey('sk-or-v1-abcdef1234567890');
      expect(result).toContain('...');
      expect(result).not.toBe('sk-or-v1-abcdef1234567890');
    });

    it('returns **** for short key', () => {
      expect(maskApiKey('abc')).toBe('****');
    });
  });

  describe('validateConfig', () => {
    it('rejects empty providers', () => {
      const result = validateConfig({
        version: 1,
        providers: {},
        preferences: { language: 'pl', autoApprove: false, maxSteps: 10 },
      });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('rejects missing apiKey', () => {
      const result = validateConfig({
        version: 1,
        providers: { default: { apiKey: '', model: 'gpt-4o-mini' } },
        preferences: { language: 'pl', autoApprove: false, maxSteps: 10 },
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('apiKey'))).toBe(true);
    });

    it('accepts valid config', () => {
      const result = validateConfig({
        version: 1,
        providers: { default: { apiKey: 'sk-xxx', model: 'gpt-4o-mini' } },
        preferences: { language: 'pl', autoApprove: false, maxSteps: 10 },
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe('redactConfig', () => {
    it('masks api keys in config', () => {
      const cfg: PlanoraConfig = {
        version: 1,
        providers: { default: { apiKey: 'sk-or-v1-abcdefghijklmnop', model: 'gpt-4o-mini' } },
        preferences: { language: 'pl', autoApprove: false, maxSteps: 10 },
      };
      const redacted = redactConfig(cfg);
      expect(redacted.providers.default.apiKey).toContain('...');
      expect(redacted.providers.default.apiKey).not.toBe('sk-or-v1-abcdefghijklmnop');
    });
  });
});
