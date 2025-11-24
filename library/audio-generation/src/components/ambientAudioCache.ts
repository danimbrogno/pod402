import { Config } from '../types';

type FileExistsFn = typeof import('fs').existsSync;
type ReadFileFn = typeof import('fs/promises').readFile;
type JoinFn = typeof import('path')['join'];

export type AmbientAudioCacheDependencies = {
  fileExists: FileExistsFn;
  readFile: ReadFileFn;
  joinPath: JoinFn;
  logger?: Pick<typeof console, 'log' | 'warn' | 'error'>;
};

export type AmbientAudioCache = {
  initialize: (config: Config) => Promise<void>;
  get: (fileNum: string) => ArrayBuffer | null;
  isCached: (fileNum: string) => boolean;
  stats: () => {
    cachedFiles: number;
    totalSizeMB: number;
  };
};

export const createAmbientAudioCache = (
  deps: AmbientAudioCacheDependencies
): AmbientAudioCache => {
  const cache = new Map<string, ArrayBuffer>();
  const logger = deps.logger ?? console;

  const initialize = async (config: Config): Promise<void> => {
    const ASSETS_DIR = config.assetsDir;
    logger.log('[ambientAudioCache] Initializing ambient audio cache...');
    logger.log('[ambientAudioCache] Assets directory:', ASSETS_DIR);

    const { ambience } = config;

    if (!deps.fileExists(ASSETS_DIR)) {
      logger.warn(
        `[ambientAudioCache] Assets directory not found: ${ASSETS_DIR}`
      );
      return;
    }

    const filesToLoad = Array.from({ length: 13 }, (_, i) =>
      String(i + 1)
        .padStart(3, '0')
        .concat(ambience.quality === 'dev' ? '_dev' : '')
    );

    let loadedCount = 0;
    let failedCount = 0;

    for (const fileNum of filesToLoad) {
      const fileName = `${fileNum}.wav`;
      const filePath = deps.joinPath(ASSETS_DIR, 'ambient', fileName);

      if (!deps.fileExists(filePath)) {
        continue;
      }

      try {
        logger.log(`[ambientAudioCache] Loading ${fileName} into cache...`);
        const startTime = Date.now();

        const fileBuffer = await deps.readFile(filePath);
        const arrayBuffer = fileBuffer.buffer.slice(
          fileBuffer.byteOffset,
          fileBuffer.byteOffset + fileBuffer.byteLength
        );

        cache.set(fileNum, arrayBuffer);

        const loadTime = Date.now() - startTime;
        const sizeMB = (arrayBuffer.byteLength / (1024 * 1024)).toFixed(2);
        logger.log(
          `[ambientAudioCache] ✓ Cached ${fileName} (${sizeMB}MB) in ${loadTime}ms`
        );
        loadedCount++;
      } catch (error) {
        logger.error(
          `[ambientAudioCache] ✗ Failed to load ${fileName}:`,
          error instanceof Error ? error.message : String(error)
        );
        failedCount++;
      }
    }

    logger.log(
      `[ambientAudioCache] Cache initialization complete: ${loadedCount} files loaded, ${failedCount} failed`
    );
  };

  const get = (fileNum: string): ArrayBuffer | null => {
    const cached = cache.get(fileNum);
    if (cached) {
      logger.log(
        `[ambientAudioCache] Using cached audio for file ${fileNum} (${(
          cached.byteLength /
          (1024 * 1024)
        ).toFixed(2)}MB)`
      );
      return cached;
    }

    logger.warn(
      `[ambientAudioCache] No cached audio found for file ${fileNum}`
    );
    return null;
  };

  return {
    initialize,
    get,
    isCached: (fileNum: string) => cache.has(fileNum),
    stats: () => ({
      cachedFiles: cache.size,
      totalSizeMB:
        Array.from(cache.values()).reduce(
          (sum, buf) => sum + buf.byteLength,
          0
        ) /
        (1024 * 1024),
    }),
  };
};
