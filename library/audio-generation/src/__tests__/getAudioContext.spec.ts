import { describe, expect, it, vi } from 'vitest';
import { createGetAudioContext } from '../components/getAudioContext';
import { createTestConfig } from '../test-utils/createTestConfig';

describe('getAudioContext', () => {
  it('configures compressor and gain according to config', () => {
    const compressor = {
      threshold: { value: 0 },
      knee: { value: 0 },
      ratio: { value: 0 },
      attack: { value: 0 },
      release: { value: 0 },
      connect: vi.fn().mockReturnThis(),
    } as unknown as DynamicsCompressorNode;
    const gainNode = {
      gain: { value: 0, exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn().mockReturnThis(),
    } as unknown as GainNode;
    const destination = {} as AudioNode;
    const context = {
      createGain: vi.fn(() => gainNode),
      createDynamicsCompressor: vi.fn(() => compressor),
      destination,
    } as unknown as AudioContext;

    const deps = {
      createContext: vi.fn(() => context),
    };

    const getAudioContext = createGetAudioContext(deps);
    const result = getAudioContext(createTestConfig());

    expect(result.context).toBe(context);
    expect(gainNode.gain.value).toBe(1);
    expect(compressor.threshold.value).toBe(-24);
    expect(compressor.connect).toHaveBeenCalledWith(gainNode);
  });
});
