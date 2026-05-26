// Agent tests — using mock AiClient

import { describe, it, expect } from 'vitest';
import type { AiClient, AiMessage, AiResponse, AiTool } from '../src/index.js';
import { PlanoraAgent } from '../src/index.js';

// ─── Mock AiClient ─────────────────────────────────

function mockClient(responses: AiResponse[]): AiClient {
  let idx = 0;
  return {
    generate: async () => {
      const r = responses[idx] || { content: '', usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 }, model: 'test', finishReason: 'stop' };
      idx++;
      return r;
    },
    generateWithTools: async () => {
      const r = responses[idx] || { content: '', usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 }, model: 'test', finishReason: 'stop' };
      idx++;
      return r;
    },
    generateStream: async function* () { return; },
    testConnection: async () => ({ ok: true, model: 'test', latency: 1 }),
  };
}

// ─── Tests ─────────────────────────────────────────

describe('PlanoraAgent', () => {
  describe('plan workflow', () => {
    it('returns success when AI responds without tool calls', async () => {
      const client = mockClient([
        { content: 'Plan gotowy', usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 }, model: 'test', finishReason: 'stop' },
      ]);
      const agent = new PlanoraAgent(client);
      const result = await agent.plan(
        { projectName: 'Test', projectDescription: 'Test desc', stack: ['TS'], outputDir: '/tmp' },
        'You are a planner. Respond in Polish.',
      );

      expect(result.status).toBe('success');
      expect(result.output).toContain('Plan gotowy');
      expect(result.stepsUsed).toBe(1);
    });

    it('returns failed on error', async () => {
      const client: AiClient = {
        ...mockClient([]),
        generateWithTools: async () => { throw new Error('API error'); },
        generate: async () => { throw new Error('API error'); },
      };
      const agent = new PlanoraAgent(client);
      const result = await agent.plan(
        { projectName: 'Test', projectDescription: 'Test', stack: ['TS'], outputDir: '/tmp' },
        'System',
      );

      expect(result.status).toBe('failed');
      expect(result.error).toContain('API error');
    });
  });

  describe('code workflow', () => {
    it('handles code workflow success', async () => {
      const client = mockClient([
        { content: 'Feature zaimplementowany', usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 }, model: 'test', finishReason: 'stop' },
      ]);
      const agent = new PlanoraAgent(client);
      const result = await agent.code(
        { projectName: 'Test', feature: 'dodaj logowanie', files: ['src/auth.ts'], projectDir: '/tmp' },
        'You are a coder.',
      );

      expect(result.status).toBe('success');
      expect(result.output).toContain('Feature zaimplementowany');
    });
  });

  describe('review workflow', () => {
    it('handles review workflow success', async () => {
      const client = mockClient([
        { content: '# Code Review\n\nOK\n\nREVIEW_COMPLETE', usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 }, model: 'test', finishReason: 'stop' },
      ]);
      const agent = new PlanoraAgent(client);
      const result = await agent.review(
        { projectName: 'Test', files: ['src/app.ts'], projectDir: '/tmp' },
        'You are a reviewer.',
      );

      expect(result.status).toBe('success');
      expect(result.output).toContain('REVIEW_COMPLETE');
    });
  });
});
