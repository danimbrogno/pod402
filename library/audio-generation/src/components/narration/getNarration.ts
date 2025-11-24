import OpenAI from 'openai';
import { Config } from '../../../types';
type Voice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

const OPENAI_VOICES: Voice[] = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];

export type GetMeditationTextFn = ReturnType<
  typeof import('./components/getMeditationText').createGetMeditationText
>;
export type GetPhraseAudioFn = ReturnType<
  typeof import('./components/getPhraseAudio').createGetPhraseAudio
>;

export type GetNarrationDependencies = {
  OpenAI: typeof OpenAI;
  getMeditationText: GetMeditationTextFn;
  getPhraseAudio: GetPhraseAudioFn;
  createAbortController: () => AbortController;
  delay: (ms: number) => Promise<void>;
  randomInt: (max: number) => number;
  logger?: Pick<typeof console, 'log' | 'error'>;
};

export const createGetNarration = (deps: GetNarrationDependencies) => {
  const logger = deps.logger ?? console;

  return async (
    config: Config,
    context: AudioContext,
    destination: AudioNode,
    narrationOptions: {
      prompt?: string;
      voice?: string;
      length?: number;
    },
    onComplete?: () => Promise<void> | void
  ): Promise<() => void> => {
    const { prompt, voice: voiceOverride, length } = narrationOptions;

    logger.log('[getNarration] Called with options:', {
      prompt:
        prompt?.substring(0, 100) +
        (prompt && prompt.length > 100 ? '...' : ''),
      voice: voiceOverride || 'random',
      length: length || 'default',
      hasOnComplete: !!onComplete,
    });

    const voice: Voice =
      voiceOverride && OPENAI_VOICES.includes(voiceOverride as Voice)
        ? (voiceOverride as Voice)
        : OPENAI_VOICES[deps.randomInt(OPENAI_VOICES.length)];

    logger.log(
      `[getNarration] Selected voice: ${voice}${
        voiceOverride ? ' (from query)' : ' (random)'
      }`
    );
    logger.log('[getNarration] Starting narration generation (non-blocking)');

    const abortController = deps.createAbortController();
    let isAborted = false;

    const openai = new deps.OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    (async () => {
      logger.log('[getNarration] Async narration promise started');
      try {
        const { delayAfterNarrationSentence, delayBeforeFirstNarration } =
          config.timing;
        logger.log('[getNarration] Timing config:', {
          delayAfterNarrationSentence,
          delayBeforeFirstNarration,
        });

        let sentenceIndex = 0;
        let isFirstSentence = true;

        logger.log('[getNarration] Starting getMeditationText with:', {
          prompt:
            prompt?.substring(0, 100) +
            (prompt && prompt.length > 100 ? '...' : ''),
          length: length || 'default',
        });

        for await (const sentence of deps.getMeditationText(config, openai, {
          prompt,
          length,
        })) {
          logger.log(
            `[getNarration] Received sentence ${
              sentenceIndex + 1
            } from generator:`,
            sentence.substring(0, 100) + (sentence.length > 100 ? '...' : '')
          );
          if (isAborted) {
            logger.log(
              `[getNarration] Aborted during sentence ${
                sentenceIndex + 1
              } generation`
            );
            break;
          }

          sentenceIndex++;
          logger.log(
            `[getNarration] Processing sentence ${sentenceIndex}, waiting for previous to finish...`
          );

          if (isFirstSentence && delayBeforeFirstNarration > 0 && !isAborted) {
            logger.log(
              `[getNarration] Waiting ${delayBeforeFirstNarration}s before first narration playback...`
            );
            await deps.delay(delayBeforeFirstNarration * 1000);
            isFirstSentence = false;
          }

          if (isAborted) {
            logger.log(
              `[getNarration] Aborted during sentence ${sentenceIndex} processing`
            );
            break;
          }

          logger.log(
            `[getNarration] Starting getPhraseAudio for sentence ${sentenceIndex} with voice: ${voice}`
          );
          logger.log(
            `[getNarration] Audio context state before getPhraseAudio: ${context.state}, currentTime: ${context.currentTime}`
          );

          try {
            for await (const _ of deps.getPhraseAudio(
              config,
              openai,
              context,
              destination,
              sentence,
              voice
            )) {
              logger.log(
                `[getNarration] getPhraseAudio yielded for sentence ${sentenceIndex}`
              );
              if (isAborted) {
                logger.log(
                  `[getNarration] Aborted during sentence ${sentenceIndex} audio playback`
                );
                break;
              }
            }
          } catch (error) {
            logger.error(
              `[getNarration] Error in getPhraseAudio for sentence ${sentenceIndex}:`,
              error
            );
            throw error;
          }

          logger.log(
            `[getNarration] Audio context state after getPhraseAudio: ${context.state}, currentTime: ${context.currentTime}`
          );

          if (isFirstSentence) {
            isFirstSentence = false;
          }

          if (isAborted) break;

          logger.log(
            `[getNarration] Sentence ${sentenceIndex} audio completed`
          );

          if (delayAfterNarrationSentence > 0 && !isAborted) {
            logger.log(
              `[getNarration] Waiting ${delayAfterNarrationSentence}s before next sentence...`
            );
            await deps.delay(delayAfterNarrationSentence * 1000);
          }
        }

        if (!isAborted) {
          logger.log('[getNarration] All narration sentences completed');
          if (onComplete) {
            await onComplete();
          }
        }
      } catch (error) {
        if (!isAborted) {
          logger.error(
            '[getNarration] Error during narration generation:',
            error
          );
        } else {
          logger.log(
            '[getNarration] Error occurred but narration was aborted, ignoring'
          );
        }
      }
    })();

    const cleanup = () => {
      if (!isAborted) {
        logger.log('[getNarration] Terminating narration generation...');
        isAborted = true;
        abortController.abort();
        logger.log('[getNarration] Narration generation terminated');
      }
    };

    logger.log(
      '[getNarration] Narration generation started in background, returning immediately'
    );

    return cleanup;
  };
};
