import { defineConfig } from 'vitest/config';

// Independent spatial checks (Willy 2). Separate from `ng test` so they never share fixtures.
export default defineConfig({
  test: {
    root: new URL('../..', import.meta.url).pathname,
    include: ['tests/terrain-map/**/*.test.ts'],
    environment: 'jsdom',
    setupFiles: ['tests/terrain-map/setup.ts'],
  },
});
