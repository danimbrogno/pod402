import { describe, expect, it, vi } from 'vitest';
import { createBuildEpisode } from '../buildEpisode';
import { createTestConfig } from '../test-utils/createTestConfig';

describe('buildEpisode', () => {
  it('wires the audio pipeline and exposes cleanup', async () => {
    const resume = vi.fn().mockResolvedValue(undefined);
    const close = vi.fn().mockResolvedValue(undefined);
    const context = {
      state: 'suspended',
      resume,
      close,
      currentTime: 0,
    } as unknown as AudioContext & { close: () => Promise<void> };

    const transcodeKill = vi.fn();
    const getAudioContext = vi.fn(() => ({
      context,
      gain: {
        gain: { value: 1, exponentialRampToValueAtTime: vi.fn() },
      } as unknown as GainNode,
      destination: {} as AudioNode,
    }));

    const transcode = vi.fn(() => ({ kill: transcodeKill }));
    const getAmbientAudio = vi.fn().mockResolvedValue({});
    const fadeOutAndEnd = vi
      .fn()
      .mockImplementation(
        (
          _config,
          _gain,
          _ctx,
          onPlaybackEnd?: () => void
        ) => onPlaybackEnd?.()
      );
    const getNarration = vi
      .fn()
      .mockImplementation(async (_config, _ctx, _dest, _options, onComplete) => {
        await onComplete?.();
        return vi.fn();
      });

    const buildEpisode = createBuildEpisode({
      getAudioContext,
      transcode,
      getAmbientAudio,
      getNarration,
      fadeOutAndEnd,
      randomInt: () => 4,
      logger: { log: vi.fn(), warn: vi.fn() },
    });

    const result = await buildEpisode(
      createTestConfig(),
      10,
      vi.fn(),
      { ambience: '42' }
    );

    expect(resume).toHaveBeenCalled();
    expect(getAmbientAudio).toHaveBeenCalledWith(
      expect.any(Object),
      context,
      expect.anything(),
      '005'
    );
    expect(getNarration).toHaveBeenCalled();
    result.cleanup();
    expect(transcodeKill).toHaveBeenCalled();
    expect(close).toHaveBeenCalled();
  });
});
