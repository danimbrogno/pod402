import { describe, expect, it, vi } from 'vitest';
import OpenAI from 'openai';
import { createGetMeditationText } from '../components/narration/components/getMeditationText';
import { createTestConfig } from '../test-utils/createTestConfig';

const createChunk = (content: string) =>
  ({
    choices: [
      {
        delta: { content },
      },
    ],
  }) as OpenAI.Chat.Completions.ChatCompletionChunk;

describe('getMeditationText', () => {
  it('splits streamed content into sentences', async () => {
    async function* stream() {
      yield createChunk('First sentence. Second');
      yield createChunk(' sentence? Third one');
      yield createChunk(' ends here!');
    }

    const getMeditationText = createGetMeditationText({
      createChatCompletionStream: vi.fn(async () => stream()),
      logger: { log: vi.fn() },
    });

    const generator = getMeditationText(
      createTestConfig(),
      {} as OpenAI,
      { prompt: 'Hello', length: 2 }
    );

    const sentences: string[] = [];
    for await (const sentence of generator) {
      sentences.push(sentence);
    }

    expect(sentences).toEqual([
      'First sentence.',
      'Second sentence?',
      'Third one ends here!',
    ]);
  });

  it('yields remaining text at the end of the stream', async () => {
    async function* stream() {
      yield createChunk('Incomplete thought without punctuation');
    }

    const getMeditationText = createGetMeditationText({
      createChatCompletionStream: vi.fn(async () => stream()),
      logger: { log: vi.fn() },
    });

    const iterator = getMeditationText(
      createTestConfig(),
      {} as OpenAI,
      { prompt: 'Test', length: 1 }
    );
    const { value, done } = await iterator.next();

    expect(done).toBe(false);
    expect(value).toContain('Incomplete thought');
  });
});
