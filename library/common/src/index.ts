/**
 * Generic TypeScript library utilities
 */

import { existsSync } from 'fs';
import { join, resolve } from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

/**
 * Formats a message with a source identifier
 * @param source - The source identifier
 * @returns Formatted message string
 */
export function formatMessage(source: string): string {
  return `Hello from ${source}!`;
}

/**
 * Library version
 */
export const version = '0.0.1';

/**
 * Utility function to check if a value is defined
 * @param value - Value to check
 * @returns True if value is not null or undefined
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Utility function to create a delay
 * @param ms - Milliseconds to delay
 * @returns Promise that resolves after the delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Utility function to retry an async operation
 * @param fn - Function to retry
 * @param retries - Number of retries
 * @param delayMs - Delay between retries in milliseconds
 * @returns Result of the function
 */
export async function retry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delayMs: number = 1000,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      await delay(delayMs);
      return retry(fn, retries - 1, delayMs);
    }
    throw error;
  }
}

/**
 * Load environment variables from project root .env file
 * This ensures all apps can access the same .env file at the project root
 */
export function loadEnvFromRoot(): void {
  try {
    // Use synchronous require for dotenv (works in both CommonJS and ES modules when bundled)
    const dotenv = require('dotenv');
    const { resolve } = require('path');
    const { existsSync, readFileSync } = require('fs');

    // Try to find project root by looking for package.json or going up from current dir
    let rootPath = process.cwd();

    // Look for root indicators (package.json with workspaces, or turbo.json)
    let currentPath = rootPath;
    for (let i = 0; i < 5; i++) {
      const packageJsonPath = resolve(currentPath, 'package.json');
      const turboJsonPath = resolve(currentPath, 'turbo.json');

      if (existsSync(packageJsonPath)) {
        try {
          const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
          if (pkg.workspaces || pkg.name === 'web3-starter') {
            rootPath = currentPath;
            break;
          }
        } catch {
          // Continue searching
        }
      }

      if (existsSync(turboJsonPath)) {
        rootPath = currentPath;
        break;
      }

      currentPath = resolve(currentPath, '..');
    }

    const envPath = resolve(rootPath, '.env');
    if (existsSync(envPath)) {
      dotenv.config({ path: envPath });
    }
  } catch (error) {
    // Silently fail if dotenv is not available or .env doesn't exist
    // This allows the app to work with environment variables set elsewhere
  }
}

/**
 * Resolves the assets directory path.
 * Priority:
 * 1. ASSETS_PATH environment variable (if set)
 * 2. Relative path from project root (assets/)
 * 3. Fallback paths for different execution contexts
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
      `[getAssetsDir] ASSETS_PATH environment variable set but path does not exist: ${envPath}`,
    );
  }

  // Get the directory path for ES modules (from library location)
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  // Try paths relative to library location (library/common/src)
  // Go up to project root, then to assets at root
  const possiblePaths = [
    // From library/common/src -> ../../assets
    join(__dirname, '../../../assets'),
    // From library/common (if built) -> ../assets
    join(__dirname, '../../assets'),
    // From project root -> assets
    join(process.cwd(), 'assets'),
    // Fallback: relative to current working directory
    join(process.cwd(), 'assets'),
  ];

  for (const assetsDir of possiblePaths) {
    const resolvedPath = resolve(assetsDir);
    if (existsSync(resolvedPath)) {
      return resolvedPath;
    }
  }

  // If none found, return the first attempted path and log a warning
  const fallbackPath = resolve(possiblePaths[0]);
  console.warn(
    `[getAssetsDir] Assets directory not found. Tried multiple paths. Using fallback: ${fallbackPath}`,
  );
  return fallbackPath;
}
