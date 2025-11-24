import { defineConfig } from 'drizzle-kit';
import dotenvFlow from 'dotenv-flow';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load .env files from project root (go up from library/drizzle to project root)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '../..');
dotenvFlow.config({
  node_env: process.env.NODE_ENV || 'development',
  default_node_env: 'development',
  path: projectRoot,
  silent: true,
});

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
