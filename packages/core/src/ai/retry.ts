// Exponential backoff retry for AiClient calls

import { AiError, RateLimitError, ServerError, TimeoutError } from './errors';

export interface RetryConfig {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  retryableStatuses?: number[];
}

const DEFAULT_RETRY: Required<RetryConfig> = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  retryableStatuses: [429, 500, 502, 503, 504],
};

export function isRetryable(error: unknown, config: RetryConfig = {}): boolean {
  const c = { ...DEFAULT_RETRY, ...config };

  if (error instanceof RateLimitError) return true;
  if (error instanceof ServerError) return c.retryableStatuses.includes(error.statusCode ?? 500);
  if (error instanceof TimeoutError) return true;
  if (error instanceof AiError && error.statusCode && c.retryableStatuses.includes(error.statusCode))
    return true;

  // Network errors (fetch fails entirely)
  if (error instanceof TypeError && error.message.includes('fetch')) return true;

  return false;
}

export function calcDelay(attempt: number, config: RetryConfig = {}): number {
  const c = { ...DEFAULT_RETRY, ...config };
  const delay = c.baseDelayMs * Math.pow(2, attempt - 1);
  return Math.min(delay, c.maxDelayMs);
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {},
): Promise<T> {
  const c = { ...DEFAULT_RETRY, ...config };
  let lastError: unknown;

  for (let attempt = 1; attempt <= c.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === c.maxAttempts || !isRetryable(error, c)) {
        throw error;
      }
      const delay = calcDelay(attempt, c);
      await sleep(delay);
    }
  }

  throw lastError;
}
