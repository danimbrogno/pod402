// Load environment variables from project root using dotenv-flow
// This loads .env, .env.local, .env.{NODE_ENV}, and .env.{NODE_ENV}.local
import dotenvFlow from 'dotenv-flow';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'node:fs';

// Find project root (go up from apps/worker to project root)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// vitest.setup.ts is in apps/worker/, so go up 2 levels to reach project root
const projectRoot = resolve(__dirname, '../..');

// Debug: Check if .env.local exists
const envLocalPath = resolve(projectRoot, '.env.local');
console.log('[vitest.setup] Project root:', projectRoot);
console.log('[vitest.setup] .env.local path:', envLocalPath);
console.log('[vitest.setup] .env.local exists:', existsSync(envLocalPath));
console.log('[vitest.setup] NODE_ENV:', process.env.NODE_ENV);

// Load environment variables
// Don't set node_env to 'test' - use 'development' as default so .env.local loads
const result = dotenvFlow.config({
  node_env: process.env.NODE_ENV || 'development',
  default_node_env: 'development',
  path: projectRoot,
  silent: false, // Enable logging to see what's happening
});

if (result && result.parsed) {
  console.log(
    '[vitest.setup] Loaded',
    Object.keys(result.parsed).length,
    'environment variable(s)',
  );
}

// Verify critical environment variables are loaded (for debugging)
if (!process.env.OPENAI_API_KEY) {
  console.warn(
    '[vitest.setup] WARNING: OPENAI_API_KEY not found after loading .env files',
  );
  console.warn('[vitest.setup] Current working directory:', process.cwd());
  console.warn('[vitest.setup] Project root:', projectRoot);
} else {
  console.log(
    '[vitest.setup] OPENAI_API_KEY loaded successfully (length:',
    process.env.OPENAI_API_KEY.length,
    ')',
  );
}
