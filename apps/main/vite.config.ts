import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/vite-tsconfig-paths';

export default defineConfig(() => ({
  plugins: [nxViteTsPaths(), react()],
  server: {
    host: 'localhost',
    port: 4200
  },
  preview: {
    host: 'localhost',
    port: 4300
  },
  build: {
    outDir: '../../dist/apps/main'
  }
}));
