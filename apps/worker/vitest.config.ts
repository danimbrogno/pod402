import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 150000, // 2.5 minutes for e2e tests
    hookTimeout: 10000,
    setupFiles: ['./vitest.setup.ts'],
  },
});
