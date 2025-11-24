import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import { resolve } from 'path';

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      '@project/common': resolve(__dirname, '../../library/common/src'),
      '@project/drizzle': resolve(__dirname, '../../library/drizzle/src'),
      '@project/trpc': resolve(__dirname, '../../library/trpc/src'),
      '@project/contracts': resolve(__dirname, '../../library/contracts/src'),
      '@project/audio-generation': resolve(
        __dirname,
        '../../library/audio-generation/src',
      ),
      '@project/ponder-config': resolve(
        __dirname,
        '../../library/ponder-config/src',
      ),
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
  },
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 150000, // 2.5 minutes for e2e tests
    hookTimeout: 10000,
    setupFiles: ['./vitest.setup.ts'],
  },
});
