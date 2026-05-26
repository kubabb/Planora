// Planora AiClient — shared types for direct LLM communication
// No external dependencies. Uses fetch() for all providers.

export type AiProvider = 'openrouter' | 'openai' | 'ollama' | 'opencode' | 'openai-compatible';

export interface AiConfig {
  provider: AiProvider;
  apiKey: string;
  model: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}

export type AiConfigOverrides = Partial<Omit<AiConfig, 'provider'>>;

export interface AiMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  toolCallId?: string;
  toolCalls?: AiToolCall[];
}

export interface AiToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface AiTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface AiResponse {
  content: string;
  toolCalls?: AiToolCall[];
  usage: AiUsage;
  model: string;
  finishReason: 'stop' | 'tool_calls' | 'length' | 'content_filter';
}

export interface AiUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface AiStreamEvent {
  type: 'text' | 'tool_call' | 'done';
  content?: string;
  toolCall?: Partial<AiToolCall>;
  usage?: AiUsage;
}

export interface AiConnectionTest {
  ok: boolean;
  model: string;
  latency: number;
  error?: string;
}
