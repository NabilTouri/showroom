import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  build: { chunkSizeWarningLimit: 1500, target: 'esnext' },
  test: { include: ['src/**/*.test.ts'] },
});
