import { Config } from '../../../../../../interface';
import { getMeditationText } from './components/getMeditationText';
import { getPhraseAudio } from './components/getPhraseAudio';
import { logger } from '../../../../../../utils/logger';
import { createOpenAIClient } from '../../../../../../utils/openaiClient';
import { AbortManager } from '../../../../../../utils/abortManager';

// Available OpenAI TTS voices
const OPENAI_VOICES: Array<
  'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'
> = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];

/**
 * Select voice from override or pick random
 */
function selectVoice(voiceOverride?: string): typeof OPENAI_VOICES[number] {
  if (voiceOverride && OPENAI_VOICES.includes(voiceOverride as any)) {
    return voiceOverride as typeof OPENAI_VOICES[number];
  }
  return OPENAI_VOICES[Math.floor(Math.random() * OPENAI_VOICES.length)];
}

/**
 * Process narration using generators for clean async flow
 */
async function* processNarration(
  config: Config,
  openai: ReturnType<typeof createOpenAIClient>,
  context: AudioContext,
  destination: AudioNode,
  options: {
    prompt?: string;
    voice: typeof OPENAI_VOICES[number];
    length?: number;
  },
  abortManager: AbortManager
): AsyncGenerator<void, void, unknown> {
  const { delayAfterNarrationSentence, delayBeforeFirstNarration } =
    config.timing;

  let isFirstSentence = true;

  // Generate and process sentences sequentially
  for await (const sentence of getMeditationText(
    config,
    openai,
    {
      prompt: options.prompt,
      length: options.length,
    },
    abortManager
  )) {
    abortManager.throwIfAborted();

    // Apply delay before first narration
    if (isFirstSentence && delayBeforeFirstNarration > 0) {
      logger.debug(`Waiting before first narration`, {
        component: 'getNarration',
        delay: `${delayBeforeFirstNarration}s`,
      });
      await new Promise((resolve) =>
        setTimeout(resolve, delayBeforeFirstNarration * 1000)
      );
      isFirstSentence = false;
    }

    abortManager.throwIfAborted();

    // Generate and play audio for this sentence
    // The generator yields when playback completes
    for await (const _ of getPhraseAudio(
      config,
      openai,
      context,
      destination,
      sentence,
      options.voice,
      abortManager
    )) {
      // Generator yields when audio playback completes
      abortManager.throwIfAborted();
    }

    // Add delay after sentence (except for the last one)
    if (delayAfterNarrationSentence > 0) {
      abortManager.throwIfAborted();
      logger.debug(`Waiting after sentence`, {
        component: 'getNarration',
        delay: `${delayAfterNarrationSentence}s`,
      });
      await new Promise((resolve) =>
        setTimeout(resolve, delayAfterNarrationSentence * 1000)
      );
    }
  }
}

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
  const voice = selectVoice(voiceOverride);

  logger.info(`Starting narration generation`, {
    component: 'getNarration',
    promptPreview: prompt?.substring(0, 100) + (prompt && prompt.length > 100 ? '...' : ''),
    voice,
    voiceSource: voiceOverride ? 'query' : 'random',
    length: length || 'default',
  });

  const openai = createOpenAIClient();
  const abortManager = new AbortManager();

  // Process narration in background
  const narrationPromise = (async () => {
    try {
      // Process all sentences using the generator
      for await (const _ of processNarration(
        config,
        openai,
        context,
        destination,
        { prompt, voice, length },
        abortManager
      )) {
        // Generator yields when each sentence completes
      }

      if (!abortManager.isAborted()) {
        logger.info(`All narration sentences completed`, {
          component: 'getNarration',
        });

        if (onComplete) {
          await onComplete();
        }
      }
    } catch (error) {
      if (abortManager.isAborted()) {
        logger.info(`Narration aborted`, {
          component: 'getNarration',
        });
        return;
      }

      logger.error(`Error during narration generation`, error, {
        component: 'getNarration',
      });
      throw error;
    }
  })();

  // Return cleanup function
  return () => {
    if (!abortManager.isAborted()) {
      logger.info(`Terminating narration generation`, {
        component: 'getNarration',
      });
      abortManager.abort();
    }
  };
};
