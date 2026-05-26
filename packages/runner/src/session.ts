// AgentSession — manages conversation state for an agent run

import type { AiMessage, AiToolCall } from '@planora/core';
import type { AgentConfig } from './config';

export class AgentSession {
  messages: AiMessage[] = [];
  runId: string;
  projectId: string;
  startedAt: Date;
  stepCount = 0;
  tokensUsed = 0;

  constructor(
    projectId: string,
    runId: string,
    private config: AgentConfig,
  ) {
    this.projectId = projectId;
    this.runId = runId;
    this.startedAt = new Date();
  }

  addSystem(content: string): void {
    this.messages.push({ role: 'system', content });
  }

  addUser(content: string): void {
    this.messages.push({ role: 'user', content });
  }

  addAssistant(content: string, toolCalls?: AiToolCall[]): void {
    this.messages.push({ role: 'assistant', content, toolCalls });
  }

  addToolResult(toolCallId: string, result: string): void {
    this.messages.push({
      role: 'tool',
      content: result,
      toolCallId,
    });
  }

  /** Get messages fitting within approximate token limit */
  getContextWindow(maxTokens?: number): AiMessage[] {
    const limit = maxTokens ?? this.config.maxContextTokens ?? 8000;
    // Simple estimate: 4 chars ~= 1 token
    let total = 0;
    const result: AiMessage[] = [];

    // Always include system message first
    const systemMsg = this.messages.find((m) => m.role === 'system');
    if (systemMsg) {
      result.push(systemMsg);
      total += Math.ceil(systemMsg.content.length / 4);
    }

    // Then include recent messages until limit
    const rest = this.messages.filter((m) => m.role !== 'system');
    for (let i = rest.length - 1; i >= 0; i--) {
      const msg = rest[i];
      const estTokens = Math.ceil(msg.content.length / 4);
      if (total + estTokens > limit && result.length > 1) break;
      result.splice(systemMsg ? 1 : 0, 0, msg); // insert after system
      total += estTokens;
    }

    return result;
  }

  /** Estimated total tokens used */
  estimateTokens(): number {
    return this.messages.reduce((sum, m) => sum + Math.ceil(m.content.length / 4), 0);
  }
}
