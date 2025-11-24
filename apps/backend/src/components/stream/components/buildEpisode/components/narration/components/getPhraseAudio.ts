import OpenAI from 'openai';
import { Config } from '../../../../../../../interface';

export async function* getPhraseAudio(
  config: Config,
  openai: OpenAI,
  context: AudioContext,
  destination: AudioNode,
  text: string,
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer',
): AsyncGenerator<void, void, unknown> {
  const {
    openai: { speechInstruction: instructions },
    levels,
  } = config;

  console.log(
    `[getPhraseAudio] Generating audio for phrase: "${text.substring(0, 50)}${
      text.length > 50 ? '...' : ''
    }" with voice: ${voice}`,
  );

  const wav = await openai.audio.speech.create({
    model: 'gpt-4o-mini-tts',
    voice,
    input: text,
    instructions,
    stream_format: 'audio',
    response_format: 'wav',
    speed: 1,
  });

  const fileBuffer = await wav.arrayBuffer();
  console.log(
    `[getPhraseAudio] Received audio buffer: ${fileBuffer.byteLength} bytes`,
  );

  // Decode the audio data into an AudioBuffer
  // This will hold the decoded wav audio data in memory
  console.log(
    `[getPhraseAudio] Decoding audio data, context state: ${context.state}`,
  );
  let audioBuffer: AudioBuffer;
  try {
    audioBuffer = await context.decodeAudioData(fileBuffer);
    console.log(
      `[getPhraseAudio] Audio decoded successfully: ${audioBuffer.duration}s, ${audioBuffer.sampleRate}Hz, ${audioBuffer.numberOfChannels} channels`,
    );
  } catch (error) {
    console.error(`[getPhraseAudio] Failed to decode audio:`, error);
    throw error;
  }

  const source = context.createBufferSource();
  source.buffer = audioBuffer;
  source.loop = false;

  const gain = context.createGain();
  gain.gain.value = levels.narration;
  console.log(
    `[getPhraseAudio] Setting narration gain to: ${levels.narration}`,
  );

  source.connect(gain);
  gain.connect(destination);
  console.log(
    `[getPhraseAudio] Audio nodes connected: source -> gain -> destination`,
  );

  // Yield when the audio finishes playing
  const currentTime = context.currentTime;
  const startTime = currentTime;
  const endTime = startTime + audioBuffer.duration;
  console.log(
    `[getPhraseAudio] Audio context state: ${context.state}, currentTime: ${currentTime}`,
  );
  console.log(
    `[getPhraseAudio] Scheduling audio to start at ${startTime}, will end at ${endTime} (duration: ${audioBuffer.duration}s)`,
  );

  try {
    source.start(startTime);
    source.onended = () => {
      console.log(`[getPhraseAudio] source.onended fired`);
    };
    console.log(`[getPhraseAudio] source.start() called successfully`);
  } catch (error) {
    console.error(`[getPhraseAudio] Error calling source.start():`, error);
    throw error;
  }

  // Wait for the audio to finish, then yield
  console.log(
    `[getPhraseAudio] Setting up onended handler, expected duration: ${audioBuffer.duration}s`,
  );
  await new Promise<void>((resolve, reject) => {
    let resolved = false;
    const timeout = setTimeout(
      () => {
        if (!resolved) {
          resolved = true;
          console.error(
            `[getPhraseAudio] TIMEOUT: Audio did not complete within ${audioBuffer.duration + 5}s. Audio may not be playing.`,
          );
          console.error(
            `[getPhraseAudio] Context state: ${context.state}, currentTime: ${context.currentTime}`,
          );
          reject(
            new Error(
              `Audio playback timeout after ${audioBuffer.duration + 5}s`,
            ),
          );
        }
      },
      (audioBuffer.duration + 5) * 1000,
    ); // 5 second buffer

    source.onended = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        console.log(
          `[getPhraseAudio] Audio playback completed for phrase: "${text.substring(
            0,
            50,
          )}${text.length > 50 ? '...' : ''}"`,
        );
        console.log(
          `[getPhraseAudio] onended fired at context.currentTime: ${context.currentTime}`,
        );
        resolve();
      } else {
        console.warn(
          `[getPhraseAudio] onended fired but promise already resolved/rejected`,
        );
      }
    };

    console.log(
      `[getPhraseAudio] onended handler registered, waiting for audio to complete...`,
    );
  });

  yield;
}
