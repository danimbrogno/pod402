import OpenAI from 'openai';
import { Config } from '../../../../types';

type ChatCompletionStreamFactory = (
  openai: OpenAI,
  params: Parameters<OpenAI['chat']['completions']['create']>[0]
) => Promise<
  AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>
>;

export type GetMeditationTextDependencies = {
  createChatCompletionStream: ChatCompletionStreamFactory;
  logger?: Pick<typeof console, 'log'>;
};

export const createGetMeditationText = (
  deps: GetMeditationTextDependencies
) => {
  const logger = deps.logger ?? console;

  return async function* getMeditationText(
    config: Config,
    openai: OpenAI,
    {
      prompt = 'Give me a meditation about gratitude',
      length = 20,
    }: {
      prompt?: string;
      length?: number;
    }
  ): AsyncGenerator<string, void, unknown> {
    logger.log('[getMeditationText] Function called');
    logger.log('[getMeditationText] Starting meditation text generation');

    const normalizedPrompt =
      prompt.substring(0, 150) + (prompt.length > 150 ? ' and so on...' : '');

    logger.log('[getMeditationText] Parameters:', {
      prompt: normalizedPrompt,
      length,
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    });

    const stream = await deps.createChatCompletionStream(openai, {
      model: 'gpt-5-nano',
      messages: [
        { role: 'user', content: normalizedPrompt },
        {
          role: 'system',
          content: config.openai.textInstruction(length),
        },
      ],
      stream: true,
    });

    logger.log('[getMeditationText] Stream started, waiting for chunks...');
    let currentSentence = '';
    let sentenceCount = 0;
    let totalChunks = 0;

    const findSentenceEnd = (text: string): number => {
      const sentenceEndRegex = /[.!?](?:\s+|$)/;
      const match = text.match(sentenceEndRegex);
      return match ? match.index! + match[0].length : -1;
    };

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';

      if (content) {
        totalChunks++;
        currentSentence += content;

        let sentenceEndIndex = findSentenceEnd(currentSentence);

        while (sentenceEndIndex !== -1) {
          const completeSentence = currentSentence
            .substring(0, sentenceEndIndex)
            .trim();

          if (completeSentence) {
            sentenceCount++;
            const preview =
              completeSentence.substring(0, 50) +
              (completeSentence.length > 50 ? '...' : '');
            logger.log(
              `[getMeditationText] Sentence ${sentenceCount} yielded (${completeSentence.length} chars): "${preview}"`
            );
            yield completeSentence;
          }

          currentSentence = currentSentence.substring(sentenceEndIndex).trim();
          sentenceEndIndex = findSentenceEnd(currentSentence);
        }
      }
    }

    logger.log(
      `[getMeditationText] Stream completed. Total chunks received: ${totalChunks}`
    );

    const finalSentence = currentSentence.trim();
    if (finalSentence) {
      sentenceCount++;
      const preview =
        finalSentence.substring(0, 50) +
        (finalSentence.length > 50 ? '...' : '');
      logger.log(
        `[getMeditationText] Final sentence ${sentenceCount} yielded (${finalSentence.length} chars): "${preview}"`
      );
      yield finalSentence;
    }

    logger.log(
      `[getMeditationText] Completed. Total sentences: ${sentenceCount}`
    );
  };
};
