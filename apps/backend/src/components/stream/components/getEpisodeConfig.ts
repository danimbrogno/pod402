import { StreamConfig } from './interface';

export function getEpisodeConfig({
  ffmpegPath,
  ffprobePath,
}: {
  ffmpegPath: string;
  ffprobePath: string;
}): StreamConfig {
  return {
    channels: 2,
    frequency: 44100,
    bytesPerSample: 2,
    format: 1,
    ffmpeg: {
      ffmpegPath,
      ffprobePath,
    },
    bellInterval: 60,
    levels: {
      ambience: 0.25,
      narration: 0.75,
      fx: 0.25,
      speech: 0.75,
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
      delayAfterNarrationParagraph: 11,
      delayBeforeFirstNarration: 2,
      delayBeforeUnguidedWelcome: 4,
      fadeIn: 3,
      fadeOut: 10,
      maxLength: 60 * 60,
    },
    openai: {
      instructions:
        'Speak like a meditation  coach. Calm, soothing, slow and deliberate',
    },
    errorMessage:
      "Sorry, I'm having trouble generating a meditation right now. Please try again later.",
  };
}
