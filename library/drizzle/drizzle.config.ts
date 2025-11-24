import { defineConfig } from 'drizzle-kit';
import { loadEnvFromRoot } from '@project/common';

// Load .env from project root
loadEnvFromRoot();

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error('DATABASE_URL is not set');
}

export default defineConfig({
  schema: './src/index.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url,
  },
});
