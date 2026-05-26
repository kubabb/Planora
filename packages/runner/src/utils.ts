// Runner utilities

import * as crypto from 'node:crypto';

export function generateId(): string {
  return crypto.randomUUID();
}
