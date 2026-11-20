import { defineConfig } from '@playwright/test';

// One worker, serial order: tests share one isolated profile and a restart in the middle.
export default defineConfig({
  testDir: '.',
  testMatch: /smoke\.spec\.mjs$/,
  timeout: 240_000,
  expect: { timeout: 15_000 },
  workers: 1,
  fullyParallel: false,
  retries: 0,
  reporter: [['list']],
  outputDir: 'results/test-output',
});
