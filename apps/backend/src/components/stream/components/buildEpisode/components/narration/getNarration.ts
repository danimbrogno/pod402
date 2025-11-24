import OpenAI from 'openai';
import { Config } from '@project/audio-generation';
import { getMeditationText } from './components/getMeditationText';
import { getPhraseAudio } from './components/getPhraseAudio';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Available OpenAI TTS voices
const OPENAI_VOICES: Array<
  'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'
> = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];

export const getNarration = async (
  config: Config,
  context: AudioContext,
  destination: AudioNode,
  narrationOptions: {
    prompt?: string;
    voice?: string;
    length?: number;
  },
  onComplete?: () => Promise<void>
): Promise<() => void> => {
  const { prompt, voice: voiceOverride, length } = narrationOptions;

  console.log('[getNarration] Called with options:', {
    prompt:
      prompt?.substring(0, 100) + (prompt && prompt.length > 100 ? '...' : ''),
    voice: voiceOverride || 'random',
    length: length || 'default',
    hasOnComplete: !!onComplete,
  });

  // Use provided voice or pick a random voice for this meditation session
  const voice =
    voiceOverride && OPENAI_VOICES.includes(voiceOverride as any)
      ? (voiceOverride as
          | 'alloy'
          | 'echo'
          | 'fable'
          | 'onyx'
          | 'nova'
          | 'shimmer')
      : OPENAI_VOICES[Math.floor(Math.random() * OPENAI_VOICES.length)];
  console.log(
    `[getNarration] Selected voice: ${voice}${
      voiceOverride ? ' (from query)' : ' (random)'
    }`
  );
  console.log('[getNarration] Starting narration generation (non-blocking)');

  // Create an AbortController to allow cancellation
  const abortController = new AbortController();
  let isAborted = false;

  // Process sentences sequentially without blocking the caller
  // Each sentence will play its audio, and the next will start when the previous finishes
  const narrationPromise = (async () => {
    console.log('[getNarration] Async narration promise started');
    try {
      const { delayAfterNarrationSentence, delayBeforeFirstNarration } =
        config.timing;
      console.log('[getNarration] Timing config:', {
        delayAfterNarrationSentence,
        delayBeforeFirstNarration,
      });

      let sentenceIndex = 0;
      let isFirstSentence = true;

      console.log('[getNarration] Starting getMeditationText with:', {
        prompt:
          prompt?.substring(0, 100) +
          (prompt && prompt.length > 100 ? '...' : ''),
        length: length || 'default',
      });

      // Start generating text immediately - don't wait for delay
      // The delay will be applied after the first sentence's audio is generated
      for await (const sentence of getMeditationText(config, openai, {
        prompt,
        length,
      })) {
        console.log(
          `[getNarration] Received sentence ${
            sentenceIndex + 1
          } from generator:`,
          sentence.substring(0, 100) + (sentence.length > 100 ? '...' : '')
        );
        if (isAborted) {
          console.log(
            `[getNarration] Aborted during sentence ${
              sentenceIndex + 1
            } generation`
          );
          break;
        }

        sentenceIndex++;
        console.log(
          `[getNarration] Processing sentence ${sentenceIndex}, waiting for previous to finish...`
        );

        // Apply delay before first narration (if configured) - but only after we have the text
        if (isFirstSentence && delayBeforeFirstNarration > 0 && !isAborted) {
          console.log(
            `[getNarration] Waiting ${delayBeforeFirstNarration}s before first narration playback...`
          );
          await new Promise((resolve) =>
            setTimeout(resolve, delayBeforeFirstNarration * 1000)
          );
          isFirstSentence = false;
        }

        if (isAborted) {
          console.log(
            `[getNarration] Aborted during sentence ${sentenceIndex} processing`
          );
          break;
        }

        console.log(
          `[getNarration] Starting getPhraseAudio for sentence ${sentenceIndex} with voice: ${voice}`
        );
        console.log(
          `[getNarration] Audio context state before getPhraseAudio: ${context.state}, currentTime: ${context.currentTime}`
        );

        // Wait for the previous phrase's audio to finish before starting the next one
        try {
          for await (const _ of getPhraseAudio(
            config,
            openai,
            context,
            destination,
            sentence,
            voice
          )) {
            console.log(
              `[getNarration] getPhraseAudio yielded for sentence ${sentenceIndex}`
            );
            // Generator yields when audio playback completes
            if (isAborted) {
              console.log(
                `[getNarration] Aborted during sentence ${sentenceIndex} audio playback`
              );
              break;
            }
          }
        } catch (error) {
          console.error(
            `[getNarration] Error in getPhraseAudio for sentence ${sentenceIndex}:`,
            error
          );
          throw error;
        }

        console.log(
          `[getNarration] Audio context state after getPhraseAudio: ${context.state}, currentTime: ${context.currentTime}`
        );

        if (isFirstSentence) {
          isFirstSentence = false;
        }

        if (isAborted) break;

        console.log(`[getNarration] Sentence ${sentenceIndex} audio completed`);

        // Add delay after sentence (except for the last one, which will be handled by the stream ending)
        if (delayAfterNarrationSentence > 0 && !isAborted) {
          console.log(
            `[getNarration] Waiting ${delayAfterNarrationSentence}s before next sentence...`
          );
          await new Promise((resolve) =>
            setTimeout(resolve, delayAfterNarrationSentence * 1000)
          );
        }
      }
      if (!isAborted) {
        console.log('[getNarration] All narration sentences completed');

        // Call onComplete handler if provided
        if (onComplete) {
          await onComplete();
        }
      }
    } catch (error) {
      if (!isAborted) {
        console.error(
          '[getNarration] Error during narration generation:',
          error
        );
        console.error(
          '[getNarration] Error stack:',
          error instanceof Error ? error.stack : 'No stack trace'
        );
      } else {
        console.log(
          '[getNarration] Error occurred but narration was aborted, ignoring'
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
