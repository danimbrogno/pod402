import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(() => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@project/common': resolve(__dirname, '../../library/common/src'),
      '@project/drizzle': resolve(__dirname, '../../library/drizzle/src'),
      '@project/trpc': resolve(__dirname, '../../library/trpc/src')
    }
  },
  server: {
    host: 'localhost',
    port: 4200,
    headers: {
      // Allow the app to be embedded in frames (required for Farcaster Mini Apps)
      'Content-Security-Policy': "frame-ancestors *;",
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
  },
  preview: {
    host: 'localhost',
    port: 4300,
    headers: {
      // Allow the app to be embedded in frames (required for Farcaster Mini Apps)
      'Content-Security-Policy': "frame-ancestors *;",
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
  },
  build: {
    outDir: '../../dist/apps/main'
  }
}));
