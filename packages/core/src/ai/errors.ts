// AiClient errors — typed errors for different failure modes

export class AiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly provider?: string,
  ) {
    super(message);
    this.name = 'AiError';
  }
}

export class AuthError extends AiError {
  constructor(message: string, provider?: string) {
    super(message, 401, provider);
    this.name = 'AuthError';
  }
}

export class RateLimitError extends AiError {
  constructor(
    message: string,
    public readonly retryAfterSeconds?: number,
    provider?: string,
  ) {
    super(message, 429, provider);
    this.name = 'RateLimitError';
  }
}

export class TimeoutError extends AiError {
  constructor(message: string, provider?: string) {
    super(message, 408, provider);
    this.name = 'TimeoutError';
  }
}

export class ServerError extends AiError {
  constructor(message: string, statusCode: number, provider?: string) {
    super(message, statusCode, provider);
    this.name = 'ServerError';
  }
}

export class InvalidResponseError extends AiError {
  constructor(message: string, provider?: string) {
    super(message, undefined, provider);
    this.name = 'InvalidResponseError';
  }
}
