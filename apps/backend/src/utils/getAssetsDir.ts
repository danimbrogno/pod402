import { existsSync } from 'fs';
import { join, resolve } from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

// Get the directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Resolves the assets directory path.
 * Priority:
 * 1. ASSETS_PATH environment variable (if set)
 * 2. Relative path from current file location (for development)
 * 3. Fallback to project root relative path
 *
 * @returns The resolved assets directory path
 */
export function getAssetsDir(): string {
  // First, check if ASSETS_PATH environment variable is set
  if (process.env.ASSETS_PATH) {
    const envPath = resolve(process.env.ASSETS_PATH);
    if (existsSync(envPath)) {
      return envPath;
    }
    console.warn(
      `[getAssetsDir] ASSETS_PATH environment variable set but path does not exist: ${envPath}`
    );
  }

  // Try relative path from current file location (for development)
  // In dev: __dirname = apps/backend/src/utils, so go up to assets
  let assetsDir = join(__dirname, '../../assets/background');
  if (existsSync(assetsDir)) {
    return assetsDir;
  }

  // Try alternative relative path (for production builds)
  // In production: dist structure might be different
  assetsDir = join(__dirname, '../../../../assets/background');
  if (existsSync(assetsDir)) {
    return assetsDir;
  }

  // Fallback: try from project root
  assetsDir = join(__dirname, '../../../../../apps/backend/assets/background');
  if (existsSync(assetsDir)) {
    return assetsDir;
  }

  // If none found, return the first attempted path and log a warning
  console.warn(
    `[getAssetsDir] Assets directory not found. Tried multiple paths. Using fallback: ${join(__dirname, '../../assets/background')}`
  );
  return join(__dirname, '../../assets/background');
}
