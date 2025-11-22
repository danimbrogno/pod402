import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  // Load env vars based on mode (development/production)
  const env = loadEnv(mode, process.cwd(), '.env');

  return {
    resolve: {
      alias: {
        '@project/common': resolve(__dirname, '../../library/common/src'),
        '@project/drizzle': resolve(__dirname, '../../library/drizzle/src'),
        '@project/trpc': resolve(__dirname, '../../library/trpc/src'),
      },
    },
    build: {
      outDir: 'dist',
      ssr: true,
      rollupOptions: {
        input: resolve(__dirname, 'src/server.ts'),
        output: {
          format: 'es',
          entryFileNames: 'server.js',
        },
        external: (id) => {
          // Don't externalize local imports (relative paths or aliases)
          if (
            id.startsWith('.') ||
            id.startsWith('/') ||
            id.startsWith('@project/')
          ) {
            return false;
          }
          // Externalize everything else (node_modules and Node.js built-ins)
          return true;
        },
      },
      ssrEmitAssets: false,
    },
    ssr: {
      noExternal: ['@project/trpc'],
    },
    // Define env vars that will be available in the built code
    define: {
      ENVIRONMENT: env.ENVIRONMENT,
      RECEIVING_WALLET_ADDRESS: env.RECEIVING_WALLET_ADDRESS,
      FFMPEG_PATH: env.FFMPEG_PATH,
      FFPROBE_PATH: env.FFPROBE_PATH,
      OPENAI_API_KEY: env.OPENAI_API_KEY,
    },
  };
});
