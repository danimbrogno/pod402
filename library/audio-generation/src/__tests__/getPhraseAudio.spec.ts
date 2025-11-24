import { describe, expect, it, vi } from 'vitest';
import OpenAI from 'openai';
import { createGetPhraseAudio } from '../components/narration/components/getPhraseAudio';
import { createTestConfig } from '../test-utils/createTestConfig';

const createContext = () => {
  const gainNode = {
    gain: { value: 0 },
    connect: vi.fn(),
  } as unknown as GainNode;
  const source = {
    connect: vi.fn(),
    start: vi.fn(),
    loop: false,
    onended: null as null | (() => void),
  } as unknown as AudioBufferSourceNode;

  const context = {
    state: 'running',
    currentTime: 0,
    decodeAudioData: vi.fn().mockResolvedValue({
      duration: 0.5,
      sampleRate: 44100,
      numberOfChannels: 2,
    }),
    createBufferSource: vi.fn(() => source),
    createGain: vi.fn(() => gainNode),
  } as unknown as AudioContext;

  return { context, source, gainNode };
};

const waitForOnended = async (source: AudioBufferSourceNode) => {
  for (let i = 0; i < 10; i++) {
    if (typeof source.onended === 'function') {
      return;
    }
    await Promise.resolve();
  }
};

describe('getPhraseAudio', () => {
  it('plays TTS audio and waits for completion', async () => {
    const wavBuffer = new ArrayBuffer(8);
    const createSpeech = vi.fn(async () => ({
      arrayBuffer: async () => wavBuffer,
    }));

    const getPhraseAudio = createGetPhraseAudio({
      createSpeech,
      logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn() },
      setTimeoutFn: (cb) => {
        // Prevent actual timers; timeout managed manually.
        return { cb } as unknown as NodeJS.Timeout;
      },
      clearTimeoutFn: vi.fn(),
    });

    const { context, source } = createContext();
    const iterator = getPhraseAudio(
      createTestConfig(),
      {} as OpenAI,
      context,
      {} as AudioNode,
      'Hello world',
      'alloy'
    );

    const stepPromise = iterator.next();
    await waitForOnended(source);
    source.onended?.();
    const result = await stepPromise;

    expect(result.done).toBe(false);
    expect(context.decodeAudioData).toHaveBeenCalledWith(wavBuffer);
  });

  it('rejects when decoding fails', async () => {
    const createSpeech = vi.fn(async () => ({
      arrayBuffer: async () => new ArrayBuffer(4),
    }));

    const { context } = createContext();
    context.decodeAudioData = vi.fn().mockRejectedValue(new Error('boom'));

    const getPhraseAudio = createGetPhraseAudio({
      createSpeech,
      logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn() },
    });

    await expect(
      (async () => {
        const iterator = getPhraseAudio(
          createTestConfig(),
          {} as OpenAI,
          context,
          {} as AudioNode,
          'fail',
          'alloy'
        );
        await iterator.next();
      })()
    ).rejects.toThrow('boom');
  });
});
