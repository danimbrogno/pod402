import { describe, expect, it, vi } from 'vitest';
import { createAmbientAudioCache } from '../components/ambientAudioCache';
import { createTestConfig } from '../test-utils/createTestConfig';

describe('ambientAudioCache', () => {
  it('initializes cache by loading existing files', async () => {
    const readFile = vi
      .fn()
      .mockImplementation(async (path: string) =>
        Buffer.from(`audio-${path}`)
      );
    const fileExists = vi.fn((path: string) => {
      if (path === '/assets') return true;
      return path.includes('001') || path.includes('002');
    });
    const joinPath = vi.fn((...parts: string[]) => parts.join('/'));
    const logger = { log: vi.fn(), warn: vi.fn(), error: vi.fn() };

    const cache = createAmbientAudioCache({
      fileExists,
      readFile,
      joinPath,
      logger,
    });

    await cache.initialize(
      createTestConfig({ assetsDir: '/assets', ambience: { quality: 'prod' } })
    );

    expect(readFile).toHaveBeenCalledTimes(2);
    expect(cache.stats().cachedFiles).toBe(2);
    expect(cache.isCached('001')).toBe(true);
    expect(cache.get('001')).toBeInstanceOf(ArrayBuffer);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('warns and skips initialization when assets directory is missing', async () => {
    const logger = { log: vi.fn(), warn: vi.fn(), error: vi.fn() };
    const cache = createAmbientAudioCache({
      fileExists: vi.fn(() => false),
      readFile: vi.fn(),
      joinPath: vi.fn(),
      logger,
    });

    await cache.initialize(createTestConfig({ assetsDir: '/missing' }));

    expect(cache.stats().cachedFiles).toBe(0);
    expect(logger.warn).toHaveBeenCalledWith(
      '[ambientAudioCache] Assets directory not found: /missing'
    );
  });
});
