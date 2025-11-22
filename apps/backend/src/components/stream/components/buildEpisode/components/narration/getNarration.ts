import OpenAI from 'openai';
import { StreamConfig } from '../../../interface';
import { getMeditationText } from './components/getMeditationText';
import { getPhraseAudio } from './components/getPhraseAudio';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const getNarration = async (
  config: StreamConfig,
  context: AudioContext,
  destination: AudioNode,
  prompt: string
): Promise<() => void> => {
  console.log('[getNarration] Starting narration generation (non-blocking)');

  // Create an AbortController to allow cancellation
  const abortController = new AbortController();
  let isAborted = false;

  // Process paragraphs sequentially without blocking the caller
  // Each paragraph will play its audio, and the next will start when the previous finishes
  const narrationPromise = (async () => {
    try {
      const { delayAfterNarrationParagraph, delayBeforeFirstNarration } =
        config.timing;

      // Wait for the initial delay before starting narration
      if (delayBeforeFirstNarration > 0 && !isAborted) {
        console.log(
          `[getNarration] Waiting ${delayBeforeFirstNarration}s before first narration...`
        );
        await new Promise((resolve) =>
          setTimeout(resolve, delayBeforeFirstNarration * 1000)
        );
      }

      if (isAborted) {
        console.log('[getNarration] Aborted during initial delay');
        return;
      }

      let paragraphIndex = 0;
      for await (const paragraph of getMeditationText(openai, prompt)) {
        if (isAborted) {
          console.log(
            `[getNarration] Aborted during paragraph ${
              paragraphIndex + 1
            } generation`
          );
          break;
        }

        paragraphIndex++;
        console.log(
          `[getNarration] Processing paragraph ${paragraphIndex}, waiting for previous to finish...`
        );

        // Wait for the previous phrase's audio to finish before starting the next one
        for await (const _ of getPhraseAudio(
          config,
          openai,
          context,
          destination,
          paragraph
        )) {
          // Generator yields when audio playback completes
          if (isAborted) {
            console.log(
              `[getNarration] Aborted during paragraph ${paragraphIndex} audio playback`
            );
            break;
          }
        }

        if (isAborted) break;

        console.log(
          `[getNarration] Paragraph ${paragraphIndex} audio completed`
        );

        // Add delay after paragraph (except for the last one, which will be handled by the stream ending)
        if (delayAfterNarrationParagraph > 0 && !isAborted) {
          console.log(
            `[getNarration] Waiting ${delayAfterNarrationParagraph}s before next paragraph...`
          );
          await new Promise((resolve) =>
            setTimeout(resolve, delayAfterNarrationParagraph * 1000)
          );
        }
      }
      if (!isAborted) {
        console.log('[getNarration] All narration paragraphs completed');
      }
    } catch (error) {
      if (!isAborted) {
        console.error(
          '[getNarration] Error during narration generation:',
          error
        );
      }
    }
  })();

  // Return cleanup function
  const cleanup = () => {
    if (!isAborted) {
      console.log('[getNarration] Terminating narration generation...');
      isAborted = true;
      abortController.abort();
      console.log('[getNarration] Narration generation terminated');
    }
  };

  // Return immediately without waiting for narration to complete
  console.log(
    '[getNarration] Narration generation started in background, returning immediately'
  );

  return cleanup;
};
