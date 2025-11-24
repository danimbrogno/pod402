import { describe, expect, it, vi } from 'vitest';
import OpenAI from 'openai';
import { createGetNarration } from '../components/narration/getNarration';
import { createTestConfig } from '../test-utils/createTestConfig';

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('getNarration', () => {
  it('streams text and audio sequentially then fires completion', async () => {
    const sentences = async function* () {
      yield 'Sentence one.';
      yield 'Sentence two.';
    };
    const audioYield = async function* () {
      yield;
    };

    const getMeditationText = vi.fn(() => sentences());
    const getPhraseAudio = vi.fn(() => audioYield());
    const abort = vi.fn();
    const logger = { log: vi.fn(), error: vi.fn() };

    const getNarration = createGetNarration({
      OpenAI: OpenAI,
      getMeditationText,
      getPhraseAudio,
      createAbortController: () =>
        ({
          abort,
          signal: {} as AbortSignal,
        }) as AbortController,
      delay: vi.fn(() => Promise.resolve()),
      randomInt: () => 0,
      logger,
    });

    process.env.OPENAI_API_KEY = 'test-key';
    const cleanup = await getNarration(
      createTestConfig(),
      { state: 'running', currentTime: 0 } as AudioContext,
      {} as AudioNode,
      { length: 2 },
      vi.fn()
    );

    await flush();
    await flush();

    expect(getMeditationText).toHaveBeenCalled();
    expect(getPhraseAudio).toHaveBeenCalledTimes(2);

    cleanup();
    cleanup(); // second invocation should be idempotent
    expect(abort).toHaveBeenCalledTimes(1);
  });

  it('logs errors from phrase audio failures without crashing the loop', async () => {
    const sentences = async function* () {
      yield 'Sentence one.';
    };
    const getMeditationText = vi.fn(() => sentences());
    const failingPhraseAudio = vi.fn(async function* () {
      throw new Error('tts failed');
    });
    const logger = { log: vi.fn(), error: vi.fn() };

    const getNarration = createGetNarration({
      OpenAI: OpenAI,
      getMeditationText,
      getPhraseAudio: failingPhraseAudio,
      createAbortController: () =>
        ({
          abort: vi.fn(),
          signal: {} as AbortSignal,
        }) as AbortController,
      delay: vi.fn(() => Promise.resolve()),
      randomInt: () => 0,
      logger,
    });

    process.env.OPENAI_API_KEY = 'test-key';
    await getNarration(
      createTestConfig(),
      { state: 'running', currentTime: 0 } as AudioContext,
      {} as AudioNode,
      {}
    );

    await flush();

    expect(logger.error).toHaveBeenCalledWith(
      '[getNarration] Error in getPhraseAudio for sentence 1:',
      expect.any(Error)
    );
  });
});
