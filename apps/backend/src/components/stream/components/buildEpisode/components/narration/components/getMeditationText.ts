import OpenAI from 'openai';
import { Config } from '../../../../../../../interface';
import { logger } from '../../../../../../../utils/logger';
import { withRetry } from '../../../../../../../utils/openaiClient';
import { AbortManager } from '../../../../../../../utils/abortManager';

export async function* getMeditationText(
  config: Config,
  openai: OpenAI,
  {
    prompt = 'Give me a meditation about gratitude',
    length = 20,
  }: {
    prompt?: string;
    length?: number;
  },
  abortManager?: AbortManager
): AsyncGenerator<string, void, unknown> {
  const promptPreview =
    prompt.substring(0, 150) + (prompt.length > 150 ? '...' : '');
  logger.info(`Starting meditation text generation`, {
    component: 'getMeditationText',
    promptPreview,
    length,
  });

  // Truncate prompt for API
  const truncatedPrompt =
    prompt.substring(0, 150) + (prompt.length > 150 ? '...' : '');

  abortManager?.throwIfAborted();

  // Create stream with retry logic
  const stream = await withRetry(
    () =>
      openai.chat.completions.create(
        {
          model: 'gpt-5-nano',
          messages: [
            { role: 'user', content: truncatedPrompt },
            {
              role: 'system',
              content: config.openai.textInstruction(length),
            },
          ],
          stream: true,
        },
        { signal: abortManager?.getSignal() }
      ),
    { component: 'getMeditationText', operation: 'chat.completions.create' }
  );

  logger.debug(`Stream started, waiting for chunks`, {
    component: 'getMeditationText',
  });

  let currentSentence = '';
  let sentenceCount = 0;
  let totalChunks = 0;

  // Helper function to find sentence endings
  const findSentenceEnd = (text: string): number => {
    const sentenceEndRegex = /[.!?](?:\s+|$)/;
    const match = text.match(sentenceEndRegex);
    return match ? match.index! + match[0].length : -1;
  };

  try {
    for await (const chunk of stream) {
      abortManager?.throwIfAborted();

      const content = chunk.choices[0]?.delta?.content || '';

      if (content) {
        totalChunks++;
        currentSentence += content;

        // Check for sentence endings
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
            logger.debug(`Yielding sentence ${sentenceCount}`, {
              component: 'getMeditationText',
              preview,
              length: completeSentence.length,
            });
            yield completeSentence;
          }

          // Remove the yielded sentence from the buffer
          currentSentence = currentSentence.substring(sentenceEndIndex).trim();

          // Check if there are more sentence endings
          sentenceEndIndex = findSentenceEnd(currentSentence);
        }
      }
    }
  } catch (error) {
    if (abortManager?.isAborted()) {
      logger.info(`Text generation aborted`, {
        component: 'getMeditationText',
        sentencesGenerated: sentenceCount,
      });
      return;
    }
    throw error;
  }

  logger.debug(`Stream completed`, {
    component: 'getMeditationText',
    totalChunks,
  });

  // Yield any remaining text as the final sentence
  const finalSentence = currentSentence.trim();
  if (finalSentence) {
    sentenceCount++;
    const preview =
      finalSentence.substring(0, 50) + (finalSentence.length > 50 ? '...' : '');
    logger.debug(`Yielding final sentence ${sentenceCount}`, {
      component: 'getMeditationText',
      preview,
      length: finalSentence.length,
    });
    yield finalSentence;
  }

  logger.info(`Text generation completed`, {
    component: 'getMeditationText',
    totalSentences: sentenceCount,
  });
}
