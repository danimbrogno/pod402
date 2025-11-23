import OpenAI from 'openai';
import { Config } from '../../../../../../../interface';
import { logger } from '../../../../../../../utils/logger';
import { withRetry } from '../../../../../../../utils/openaiClient';
import { AbortManager } from '../../../../../../../utils/abortManager';

export async function* getPhraseAudio(
  config: Config,
  openai: OpenAI,
  context: AudioContext,
  destination: AudioNode,
  text: string,
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer',
  abortManager?: AbortManager
): AsyncGenerator<void, void, unknown> {
  const {
    openai: { speechInstruction: instructions },
    levels,
  } = config;

  const textPreview = text.substring(0, 50) + (text.length > 50 ? '...' : '');
  logger.info(`Generating audio for phrase`, {
    component: 'getPhraseAudio',
    textPreview,
    voice,
  });

  // Check if aborted before starting
  abortManager?.throwIfAborted();

  // Generate audio with retry logic
  const wav = await withRetry(
    () =>
      openai.audio.speech.create({
        model: 'gpt-4o-mini-tts',
        voice,
        input: text,
        instructions,
        stream_format: 'audio',
        response_format: 'wav',
        speed: 1,
        signal: abortManager?.getSignal(),
      }),
    { component: 'getPhraseAudio', operation: 'speech.create' }
  );

  // Check if aborted after API call
  abortManager?.throwIfAborted();

  const fileBuffer = await wav.arrayBuffer();
  logger.debug(`Received audio buffer`, {
    component: 'getPhraseAudio',
    size: `${fileBuffer.byteLength} bytes`,
  });

  // Decode the audio data
  let audioBuffer: AudioBuffer;
  try {
    audioBuffer = await context.decodeAudioData(fileBuffer);
    logger.debug(`Audio decoded successfully`, {
      component: 'getPhraseAudio',
      duration: `${audioBuffer.duration.toFixed(2)}s`,
      sampleRate: `${audioBuffer.sampleRate}Hz`,
      channels: audioBuffer.numberOfChannels,
    });
  } catch (error) {
    logger.error(`Failed to decode audio`, error, {
      component: 'getPhraseAudio',
    });
    throw error;
  }

  // Check if aborted before setting up playback
  abortManager?.throwIfAborted();

  // Create and configure audio nodes
  const source = context.createBufferSource();
  source.buffer = audioBuffer;
  source.loop = false;

  const gain = context.createGain();
  gain.gain.value = levels.narration;
  source.connect(gain);
  gain.connect(destination);

  // Schedule playback
  const startTime = context.currentTime;
  const endTime = startTime + audioBuffer.duration;

  try {
    source.start(startTime);
  } catch (error) {
    logger.error(`Error starting audio playback`, error, {
      component: 'getPhraseAudio',
    });
    throw error;
  }

  // Wait for audio to complete
  await new Promise<void>((resolve, reject) => {
    let resolved = false;
    const timeoutDuration = (audioBuffer.duration + 5) * 1000; // 5 second buffer
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        logger.error(
          `Audio playback timeout: did not complete within ${audioBuffer.duration + 5}s`,
          undefined,
          {
            component: 'getPhraseAudio',
            contextState: context.state,
            currentTime: context.currentTime,
          }
        );
        reject(
          new Error(
            `Audio playback timeout after ${audioBuffer.duration + 5}s`
          )
        );
      }
    }, timeoutDuration);

    source.onended = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        logger.debug(`Audio playback completed`, {
          component: 'getPhraseAudio',
          textPreview,
          elapsed: `${(context.currentTime - startTime).toFixed(2)}s`,
        });
        resolve();
      }
    };
  });

  yield;
}
