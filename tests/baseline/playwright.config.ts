import { defineConfig } from '@playwright/test';
import path from 'node:path';
import { launchOptions } from '../support/browser';

// Original app (commit 7885117) built by tests/baseline/prepare.sh into BASELINE_DIR.
const BASELINE_DIR = path.resolve(process.env.BASELINE_DIR ?? '../showroom-baseline');

export default defineConfig({
  testDir: '.',
  testMatch: 'compare.spec.ts',
  outputDir: '../../test-results/baseline-runs',
  timeout: 600_000,
  workers: 1,
  reporter: [['list']],
  use: { launchOptions },
  webServer: [
    {
      command: 'npm run build && npx vite preview --port 4173 --strictPort',
      cwd: '../..',
      url: 'http://localhost:4173/',
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: 'npx vite preview --port 4174 --strictPort',
      cwd: BASELINE_DIR,
      url: 'http://localhost:4174/',
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
});
