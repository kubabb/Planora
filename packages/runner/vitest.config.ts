import { defineConfig } from 'vitest/config';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  test: {
    globals: false,
  },
  resolve: {
    alias: {
      'planora-core': resolve(__dirname, '../core/src/index.ts'),
    },
  },
});
