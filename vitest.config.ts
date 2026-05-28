import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      'planora-core': resolve(__dirname, 'packages/core/src/index.ts'),
      'planora-runner': resolve(__dirname, 'packages/runner/src/index.ts'),
    },
  },
  test: {
    globals: false,
    exclude: ['node_modules/**', 'dist/**'],
  },
});
