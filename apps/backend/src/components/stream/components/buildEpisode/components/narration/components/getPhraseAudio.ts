import OpenAI from 'openai';
import { Config } from '../../../../../../../interface';

export async function* getPhraseAudio(
  config: Config,
  openai: OpenAI,
  context: AudioContext,
  destination: AudioNode,
  text: string
): AsyncGenerator<void, void, unknown> {
  const {
    openai: { speechInstruction: instructions },
    levels,
  } = config;

  console.log(
    `[getPhraseAudio] Generating audio for phrase: "${text.substring(0, 50)}${
      text.length > 50 ? '...' : ''
    }"`
  );

  const wav = await openai.audio.speech.create({
    model: 'gpt-4o-mini-tts',
    voice: 'coral',
    input: text,
    instructions,

    stream_format: 'audio',
    response_format: 'wav',
    speed: 1,
  });

  const fileBuffer = await wav.arrayBuffer();

  // Decode the audio data into an AudioBuffer
  // This will hold the decoded wav audio data in memory
  const audioBuffer = await context.decodeAudioData(fileBuffer);

  const source = context.createBufferSource();
  source.buffer = audioBuffer;
  source.loop = false;

  const gain = context.createGain();
  gain.gain.value = levels.narration;
  source.connect(gain);
  gain.connect(destination);

  // Yield when the audio finishes playing
  const currentTime = context.currentTime;
  console.log(`[getPhraseAudio] Starting audio playback at ${currentTime}`);
  source.start(currentTime);

  // Wait for the audio to finish, then yield
  await new Promise<void>((resolve) => {
    source.onended = () => {
      console.log(
        `[getPhraseAudio] Audio playback completed for phrase: "${text.substring(
          0,
          50
        )}${text.length > 50 ? '...' : ''}"`
      );
      resolve();
    };
  });

  yield;
}
