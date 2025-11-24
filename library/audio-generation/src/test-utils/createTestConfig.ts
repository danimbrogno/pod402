import { Config } from '../types';

const baseConfig: Config = {
  environment: 'development',
  receivingWallet: '0x0',
  network: 'sepolia',
  facilitator: undefined,
  channels: 2,
  frequency: 44100,
  bytesPerSample: 2,
  format: 1,
  ffmpeg: {
    ffmpegPath: '/bin/ffmpeg',
    ffprobePath: '/bin/ffprobe',
  },
  ambience: {
    quality: 'dev',
  },
  compressor: {
    threshold: -24,
    knee: 30,
    ratio: 12,
    attack: 0.003,
    release: 0.25,
  },
  levels: {
    ambience: 0.5,
    narration: 0.8,
  },
  timing: {
    delayAfterNarrationSentence: 1,
    delayBeforeFirstNarration: 0.5,
    fadeIn: 5,
    fadeOut: 2,
    maxLength: 1200,
  },
  openai: {
    speechInstruction: 'Speak calmly.',
    textInstruction: (length: number) =>
      `Provide ${length} short meditation sentences.`,
  },
  errorMessage: 'An error occurred.',
  assetsDir: '/assets',
};

export const createTestConfig = (overrides: Partial<Config> = {}): Config => ({
  ...baseConfig,
  ...overrides,
  ffmpeg: { ...baseConfig.ffmpeg, ...overrides.ffmpeg },
  ambience: { ...baseConfig.ambience, ...overrides.ambience },
  compressor: { ...baseConfig.compressor, ...overrides.compressor },
  levels: { ...baseConfig.levels, ...overrides.levels },
  timing: { ...baseConfig.timing, ...overrides.timing },
  openai: { ...baseConfig.openai, ...overrides.openai },
});
