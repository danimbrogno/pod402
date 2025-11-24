import { PassThrough } from 'stream';

export type StreamAudioContext = AudioContext & {
  pipe: (stream: PassThrough) => PassThrough;
};

export type Config = {
  environment: 'development' | 'production';
  receivingWallet: string;
  network: string;
  facilitator: string | undefined;
  channels: number;
  frequency: number;
  bytesPerSample?: number;
  format?: number;
  /** FFMPEG configuration */
  ffmpeg: {
    /** Path to ffmpeg binary */
    ffmpegPath: string;
    /** Path to ffprobe binary */
    ffprobePath: string;
  };
  ambience: {
    quality: 'dev' | 'prod';
  };
  compressor: {
    threshold: number;
    knee: number;
    ratio: number;
    attack: number;
    release: number;
  };
  levels: {
    ambience: number;
    narration: number;
  };
  timing: {
    /** Time in seconds we should wait ofter openai finishes delivering a sentence before the next sentence should start */
    delayAfterNarrationSentence: number;

    /** Time in seconds before narration should begin */
    delayBeforeFirstNarration: number;

    /** Time in seconds from when the meditation begins to when playback should be at full volume */
    fadeIn: number;
    /** Time in seconds from when the meditation ends to when playback should be at full volume */
    fadeOut: number;
    /** Maximum time in seconds that a meditation is allowed to continue for before the connection is closed */
    maxLength: number;
  };
  openai: {
    apiKey: string;
    speechInstruction: string;
    textInstruction: (length: number) => string;
  };
  errorMessage: string;
  /** Path to assets directory */
  assetsDir: string;
};
