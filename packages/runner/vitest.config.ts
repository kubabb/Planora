import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  test: {
    globals: false,
  },
  resolve: {
    alias: {
      '@planora/core': resolve(__dirname, '../core/src/index.ts'),
    },
  },
});
