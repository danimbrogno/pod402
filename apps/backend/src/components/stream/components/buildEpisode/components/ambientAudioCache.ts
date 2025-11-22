import { existsSync } from 'fs';
import { promises as fsPromises } from 'fs';
import { join } from 'path';
import { Config } from '../../../../../interface';
import { getAssetsDir } from '../../../../../utils/getAssetsDir';

// Resolve assets directory using utility function
const ASSETS_DIR = getAssetsDir();

// Cache for ambient audio files (fileNum -> ArrayBuffer)
const ambientAudioCache = new Map<string, ArrayBuffer>();

/**
 * Initialize the ambient audio cache by loading all available audio files
 */
export async function initializeAmbientAudioCache(
  config: Config
): Promise<void> {
  console.log('[ambientAudioCache] Initializing ambient audio cache...');
  console.log('[ambientAudioCache] Assets directory:', ASSETS_DIR);

  const { ambience } = config;

  if (!existsSync(ASSETS_DIR)) {
    console.warn(
      `[ambientAudioCache] Assets directory not found: ${ASSETS_DIR}`
    );
    return;
  }

  // Try to load common file numbers (001-020)
  const filesToLoad = Array.from({ length: 13 }, (_, i) =>
    String(i + 1)
      .padStart(3, '0')
      .concat(ambience.quality === 'dev' ? '_dev' : '')
  );

  let loadedCount = 0;
  let failedCount = 0;

  for (const fileNum of filesToLoad) {
    const fileName = `${fileNum}.wav`;
    const filePath = join(ASSETS_DIR, 'backgrounds', fileName);

    if (!existsSync(filePath)) {
      continue; // Skip files that don't exist
    }

    try {
      console.log(`[ambientAudioCache] Loading ${fileName} into cache...`);
      const startTime = Date.now();

      // Read the file from disk
      const fileBuffer = await fsPromises.readFile(filePath);

      // Convert to ArrayBuffer for caching
      const arrayBuffer = fileBuffer.buffer.slice(
        fileBuffer.byteOffset,
        fileBuffer.byteOffset + fileBuffer.byteLength
      );

      // Store in cache
      ambientAudioCache.set(fileNum, arrayBuffer);

      const loadTime = Date.now() - startTime;
      const sizeMB = (arrayBuffer.byteLength / (1024 * 1024)).toFixed(2);
      console.log(
        `[ambientAudioCache] ✓ Cached ${fileName} (${sizeMB}MB) in ${loadTime}ms`
      );
      loadedCount++;
    } catch (error) {
      console.error(
        `[ambientAudioCache] ✗ Failed to load ${fileName}:`,
        error instanceof Error ? error.message : String(error)
      );
      failedCount++;
    }
  }

  console.log(
    `[ambientAudioCache] Cache initialization complete: ${loadedCount} files loaded, ${failedCount} failed`
  );
}

/**
 * Get cached ambient audio ArrayBuffer
 * @param fileNum - File number (e.g., '001')
 * @returns ArrayBuffer if cached, null otherwise
 */
export function getCachedAmbientAudio(fileNum: string): ArrayBuffer | null {
  const cached = ambientAudioCache.get(fileNum);
  if (cached) {
    console.log(
      `[ambientAudioCache] Using cached audio for file ${fileNum} (${(
        cached.byteLength /
        (1024 * 1024)
      ).toFixed(2)}MB)`
    );
  } else {
    console.warn(
      `[ambientAudioCache] No cached audio found for file ${fileNum}`
    );
  }
  return cached || null;
}

/**
 * Check if a file is cached
 */
export function isCached(fileNum: string): boolean {
  return ambientAudioCache.has(fileNum);
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    cachedFiles: ambientAudioCache.size,
    totalSizeMB:
      Array.from(ambientAudioCache.values()).reduce(
        (sum, buf) => sum + buf.byteLength,
        0
      ) /
      (1024 * 1024),
  };
}
