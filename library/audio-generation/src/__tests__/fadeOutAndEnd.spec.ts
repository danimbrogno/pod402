import { describe, expect, it, vi } from 'vitest';
import { createFadeOutAndEnd } from '../components/fadeOutAndEnd';
import { createTestConfig } from '../test-utils/createTestConfig';

describe('fadeOutAndEnd', () => {
  it('ramps gain down and closes the context after fade out', () => {
    const scheduled: Array<{ delay: number; cb: () => void }> = [];
    const fadeOutAndEnd = createFadeOutAndEnd({
      setTimeoutFn: (cb, delay) => {
        scheduled.push({ cb, delay });
        return 0 as unknown as NodeJS.Timeout;
      },
    });

    const gainNode = {
      gain: {
        value: 0,
        exponentialRampToValueAtTime: vi.fn(),
      },
    } as unknown as GainNode;
    const context = {
      state: 'running',
      currentTime: 5,
      close: vi.fn(),
    } as unknown as AudioContext;
    const onPlaybackEnd = vi.fn();

    fadeOutAndEnd(createTestConfig({ timing: { fadeOut: 2 } }), gainNode, context, onPlaybackEnd);

    expect(gainNode.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(
      0,
      context.currentTime + 2
    );
    expect(scheduled[0]?.delay).toBe(2000);

    scheduled[0]?.cb();

    expect(context.close).toHaveBeenCalled();
    expect(onPlaybackEnd).toHaveBeenCalled();
  });
});
