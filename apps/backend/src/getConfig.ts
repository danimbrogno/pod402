import { Config } from './interface';
import { facilitator } from '@coinbase/x402'; // For mainnet

export function getConfig({
  ffmpegPath,
  ffprobePath,
  environment,
  receivingWallet,
}: {
  ffmpegPath: string;
  ffprobePath: string;
  receivingWallet: string;
  environment: 'development' | 'production';
}): Config {
  return {
    environment,
    receivingWallet,
    network: environment === 'production' ? 'base' : 'base-sepolia',
    facilitator: environment === 'production' ? facilitator : undefined,
    channels: 2,
    frequency: 44100,
    bytesPerSample: 2,
    format: 1,
    ffmpeg: {
      ffmpegPath,
      ffprobePath,
    },
    ambience: {
      quality: environment === 'development' ? 'dev' : 'prod',
    },
    levels: {
      ambience: 0.25,
      narration: 0.75,
    },
    compressor: {
      threshold: -50,
      knee: 40,
      ratio: 12,
      attack: 0,
      release: 0.25,
    },
    timing: {
      delayAfterNarrationSentence: 1.5,
      delayBeforeFirstNarration: 0,
      fadeIn: 3,
      fadeOut: 10,
      maxLength: 60 * 60,
    },
    openai: {
      speechInstruction:
        'Speak like a meditation coach. Calm, soothing, slow and softly.',
      textInstruction: (
        length: number
      ) => `You are a world renowned meditation coach at the start of a session with a client.
      You are going to guide them through a meditation that will last about ${length} words.
      You should jump straight into the meditation without any introduction.
      End the meditation with some expression of thanks for taking the time to meditate.
      `,
    },
    errorMessage:
      "Sorry, I'm having trouble generating a meditation right now. Please try again later.",
  };
}
