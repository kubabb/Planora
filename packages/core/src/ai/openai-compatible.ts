// Base OpenAI-compatible implementation
// All providers (OpenRouter, OpenAI, Ollama, OpenCode) extend this.
// Uses raw fetch() — zero dependencies.

import type { AiClient } from './client.js';
import type {
  AiConfig,
  AiConfigOverrides,
  AiConnectionTest,
  AiMessage,
  AiResponse,
  AiStreamEvent,
  AiTool,
  AiUsage,
} from './types.js';
import {
  AiError,
  AuthError,
  InvalidResponseError,
  RateLimitError,
  ServerError,
  TimeoutError,
} from './errors.js';
import { withRetry } from './retry.js';

const DEFAULT_TIMEOUT = 120_000;

export abstract class OpenAICompatibleClient implements AiClient {
  protected abstract baseUrl: string;
  protected extraHeaders: Record<string, string> = {};

  constructor(protected config: AiConfig) {}

  // ─── generate ────────────────────────────────────────

  async generate(
    messages: AiMessage[],
    overrides?: AiConfigOverrides,
  ): Promise<AiResponse> {
    const body = this.buildBody(messages, overrides, []);
    const data = await this.fetch('/chat/completions', body);
    return this.parseResponse(data);
  }

  // ─── generateWithTools ───────────────────────────────

  async generateWithTools(
    messages: AiMessage[],
    tools: AiTool[],
    overrides?: AiConfigOverrides,
  ): Promise<AiResponse> {
    const body = this.buildBody(messages, overrides, tools.map(this.formatTool));
    const data = await this.fetch('/chat/completions', body);
    return this.parseResponse(data);
  }

  // ─── generateStructured ──────────────────────────────

  async generateStructured<T>(
    messages: AiMessage[],
    schema: Record<string, unknown>,
    overrides?: AiConfigOverrides,
  ): Promise<T> {
    // Use JSON mode or response_format for structured output
    const body = {
      ...this.buildBody(messages, overrides, []),
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'response', strict: true, schema },
      },
    };
    const data = await this.fetch('/chat/completions', body);
    const response = this.parseResponse(data);
    try {
      return JSON.parse(response.content) as T;
    } catch {
      throw new InvalidResponseError(
        'Failed to parse structured response as JSON',
        this.config.provider,
      );
    }
  }

  // ─── generateStream ──────────────────────────────────

  async *generateStream(
    messages: AiMessage[],
    overrides?: AiConfigOverrides,
  ): AsyncIterable<AiStreamEvent> {
    const body = { ...this.buildBody(messages, overrides, []), stream: true };
    const response = await this.fetchRaw('/chat/completions', body);
    const reader = response.body?.getReader();
    if (!reader) throw new InvalidResponseError('No response body', this.config.provider);

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;
          if (!trimmed.startsWith('data: ')) continue;

          try {
            const chunk = JSON.parse(trimmed.slice(6));
            const delta = chunk.choices?.[0]?.delta;
            if (delta?.content) {
              yield { type: 'text', content: delta.content };
            }
            if (delta?.tool_calls) {
              for (const tc of delta.tool_calls) {
                yield { type: 'tool_call', toolCall: tc };
              }
            }
            if (chunk.choices?.[0]?.finish_reason === 'stop') {
              yield { type: 'done', usage: chunk.usage };
            }
          } catch {
            // skip malformed chunks
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  // ─── testConnection ──────────────────────────────────

  async testConnection(): Promise<AiConnectionTest> {
    const start = Date.now();
    try {
      const response = await this.generate([
        { role: 'user', content: 'test' },
      ], { maxTokens: 1 });
      return {
        ok: true,
        model: response.model,
        latency: Date.now() - start,
      };
    } catch (error) {
      return {
        ok: false,
        model: this.config.model,
        latency: Date.now() - start,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // ─── protected helpers ───────────────────────────────

  protected buildBody(
    messages: AiMessage[],
    overrides?: AiConfigOverrides,
    tools?: Record<string, unknown>[],
  ) {
    const body: Record<string, unknown> = {
      model: overrides?.model ?? this.config.model,
      messages: this.formatMessages(messages),
      temperature: overrides?.temperature ?? this.config.temperature ?? 0.7,
      max_tokens: overrides?.maxTokens ?? this.config.maxTokens ?? 4096,
    };
    if (tools?.length) {
      body.tools = tools;
      body.tool_choice = 'auto';
    }
    return body;
  }

  protected parseResponse(data: Record<string, unknown>): AiResponse {
    const choice = (data.choices as Array<Record<string, unknown>>)?.[0];
    if (!choice) throw new InvalidResponseError('No choices in response', this.config.provider);

    const message = choice.message as Record<string, unknown>;
    const usage = data.usage as (AiUsage & {
      prompt_tokens?: number;
      completion_tokens?: number;
      total_tokens?: number;
    }) | undefined;

    return {
      content: (message?.content as string) ?? '',
      toolCalls: message?.tool_calls as AiResponse['toolCalls'],
      usage: usage ? {
        promptTokens: usage.prompt_tokens ?? usage.promptTokens ?? 0,
        completionTokens: usage.completion_tokens ?? usage.completionTokens ?? 0,
        totalTokens: usage.total_tokens ?? usage.totalTokens ?? 0,
      } : { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      model: (data.model as string) ?? this.config.model,
      finishReason: (choice.finish_reason as AiResponse['finishReason']) ?? 'stop',
    };
  }

  protected formatMessages(messages: AiMessage[]) {
    return messages.map((message) => {
      const formatted: Record<string, unknown> = {
        role: message.role,
        content: message.content,
      };
      if (message.name) formatted.name = message.name;
      if (message.toolCalls?.length) formatted.tool_calls = message.toolCalls;
      if (message.toolCallId) formatted.tool_call_id = message.toolCallId;
      return formatted;
    });
  }

  protected formatTool(tool: AiTool) {
    return {
      type: 'function',
      function: {
        name: tool.function.name,
        description: tool.function.description,
        parameters: tool.function.parameters,
      },
    };
  }

  protected async fetch(
    path: string,
    body: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const response = await this.fetchRaw(path, body);
    return response.json() as Promise<Record<string, unknown>>;
  }

  protected async fetchRaw(
    path: string,
    body: Record<string, unknown>,
  ): Promise<Response> {
    const url = `${this.baseUrl}${path}`;
    const timeout = this.config.timeout ?? DEFAULT_TIMEOUT;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`,
      ...this.extraHeaders,
    };

    try {
      const response = await withRetry(
        async () => {
          const res = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
            signal: controller.signal,
          });
          if (!res.ok) {
            await this.handleErrorResponse(res);
          }
          return res;
        },
        { maxAttempts: 3 },
      );
      return response;
    } catch (error) {
      if (error instanceof AiError) throw error;
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new TimeoutError(`Request timed out after ${timeout}ms`, this.config.provider);
      }
      throw new AiError(
        `Request failed: ${error instanceof Error ? error.message : String(error)}`,
        undefined,
        this.config.provider,
      );
    } finally {
      clearTimeout(timer);
    }
  }

  protected async handleErrorResponse(res: Response): Promise<never> {
    let body: Record<string, unknown> = {};
    try {
      body = await res.json() as Record<string, unknown>;
    } catch { /* ignore parse errors */ }

    const error = body.error as Record<string, unknown> | undefined;
    const metadata = error?.metadata as Record<string, unknown> | undefined;
    const message = [
      (error?.message as string | undefined) ?? res.statusText,
      error?.code ? `code=${String(error.code)}` : '',
      error?.type ? `type=${String(error.type)}` : '',
      metadata?.raw ? `raw=${String(metadata.raw).slice(0, 500)}` : '',
      metadata?.provider_name ? `provider=${String(metadata.provider_name)}` : '',
    ].filter(Boolean).join(' ');

    switch (res.status) {
      case 401:
      case 403:
        throw new AuthError(message, this.config.provider);
      case 429: {
        const retryAfter = res.headers.get('Retry-After');
        throw new RateLimitError(message, retryAfter ? parseInt(retryAfter) : undefined, this.config.provider);
      }
      case 408:
        throw new TimeoutError(message, this.config.provider);
      default:
        if (res.status >= 500) {
          throw new ServerError(message, res.status, this.config.provider);
        }
        throw new AiError(message, res.status, this.config.provider);
    }
  }
}
