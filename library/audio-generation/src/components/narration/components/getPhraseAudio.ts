import OpenAI from 'openai';
import { Config } from '../../../../types';

type CreateSpeechFn = (
  openai: OpenAI,
  params: Parameters<OpenAI['audio']['speech']['create']>[0]
) => Promise<{ arrayBuffer: () => Promise<ArrayBuffer> }>;

export type GetPhraseAudioDependencies = {
  createSpeech: CreateSpeechFn;
  setTimeoutFn?: typeof setTimeout;
  clearTimeoutFn?: typeof clearTimeout;
  logger?: Pick<typeof console, 'log' | 'warn' | 'error'>;
};

export const createGetPhraseAudio = (deps: GetPhraseAudioDependencies) => {
  const logger = deps.logger ?? console;
  const setTimeoutImpl = deps.setTimeoutFn ?? setTimeout;
  const clearTimeoutImpl = deps.clearTimeoutFn ?? clearTimeout;

  return async function* getPhraseAudio(
    config: Config,
    openai: OpenAI,
    context: AudioContext,
    destination: AudioNode,
    text: string,
    voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'
  ): AsyncGenerator<void, void, unknown> {
    const {
      openai: { speechInstruction: instructions },
      levels,
    } = config;

    logger.log(
      `[getPhraseAudio] Generating audio for phrase: "${text.substring(0, 50)}${
        text.length > 50 ? '...' : ''
      }" with voice: ${voice}`
    );

    const wav = await deps.createSpeech(openai, {
      model: 'gpt-4o-mini-tts',
      voice,
      input: text,
      instructions,
      stream_format: 'audio',
      response_format: 'wav',
      speed: 1,
    });

    const fileBuffer = await wav.arrayBuffer();
    logger.log(
      `[getPhraseAudio] Received audio buffer: ${fileBuffer.byteLength} bytes`
    );

    logger.log(
      `[getPhraseAudio] Decoding audio data, context state: ${context.state}`
    );

    let audioBuffer: AudioBuffer;
    try {
      audioBuffer = await context.decodeAudioData(fileBuffer);
      logger.log(
        `[getPhraseAudio] Audio decoded successfully: ${audioBuffer.duration}s, ${audioBuffer.sampleRate}Hz, ${audioBuffer.numberOfChannels} channels`
      );
    } catch (error) {
      logger.error(`[getPhraseAudio] Failed to decode audio:`, error);
      throw error;
    }

    const source = context.createBufferSource();
    source.buffer = audioBuffer;
    source.loop = false;

    const gain = context.createGain();
    gain.gain.value = levels.narration;
    logger.log(
      `[getPhraseAudio] Setting narration gain to: ${levels.narration}`
    );

    source.connect(gain);
    gain.connect(destination);
    logger.log(
      `[getPhraseAudio] Audio nodes connected: source -> gain -> destination`
    );

    const startTime = context.currentTime;
    const endTime = startTime + audioBuffer.duration;
    logger.log(
      `[getPhraseAudio] Audio context state: ${context.state}, currentTime: ${context.currentTime}`
    );
    logger.log(
      `[getPhraseAudio] Scheduling audio to start at ${startTime}, will end at ${endTime} (duration: ${audioBuffer.duration}s)`
    );

    try {
      source.start(startTime);
      source.onended = () => {
        logger.log(`[getPhraseAudio] source.onended fired`);
      };
      logger.log(`[getPhraseAudio] source.start() called successfully`);
    } catch (error) {
      logger.error(`[getPhraseAudio] Error calling source.start():`, error);
      throw error;
    }

    logger.log(
      `[getPhraseAudio] Setting up onended handler, expected duration: ${audioBuffer.duration}s`
    );
    await new Promise<void>((resolve, reject) => {
      let resolved = false;
      const timeout = setTimeoutImpl(
        () => {
          if (!resolved) {
            resolved = true;
            logger.error(
              `[getPhraseAudio] TIMEOUT: Audio did not complete within ${
                audioBuffer.duration + 5
              }s. Audio may not be playing.`
            );
            logger.error(
              `[getPhraseAudio] Context state: ${context.state}, currentTime: ${context.currentTime}`
            );
            reject(
              new Error(
                `Audio playback timeout after ${audioBuffer.duration + 5}s`
              )
            );
          }
        },
        (audioBuffer.duration + 5) * 1000
      );

      source.onended = () => {
        if (!resolved) {
          resolved = true;
          clearTimeoutImpl(timeout);
          logger.log(
            `[getPhraseAudio] Audio playback completed for phrase: "${text.substring(
              0,
              50
            )}${text.length > 50 ? '...' : ''}"`
          );
          logger.log(
            `[getPhraseAudio] onended fired at context.currentTime: ${context.currentTime}`
          );
          resolve();
        } else {
          logger.warn(
            `[getPhraseAudio] onended fired but promise already resolved/rejected`
          );
        }
      };

      logger.log(
        `[getPhraseAudio] onended handler registered, waiting for audio to complete...`
      );
    });

    yield;
  };
};
