import { PassThrough } from 'stream';

export type StreamAudioContext = AudioContext & {
  pipe: (stream: PassThrough) => PassThrough;
};

export type StreamConfig = {
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
  /** Interval that bell should chime in seconds */
  bellInterval: number;
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
    fx: number;
    speech: number;
  };
  timing: {
    /** Time in seconds we should wait ofter openai finishes delivering a sentence before the next sentence should start */
    delayAfterNarrationSentence: number;
    /** Time in seconds we should wait after openai finishe delivering a paragraph to when the next sentence should start */
    delayAfterNarrationParagraph: number;
    /** Time in seconds before narration should begin */
    delayBeforeFirstNarration: number;
    /** Delay before welcome during unguided meditations */
    delayBeforeUnguidedWelcome: number;
    /** Time in seconds from when the meditation begins to when playback should be at full volume */
    fadeIn: number;
    /** Time in seconds from when the meditation ends to when playback should be at full volume */
    fadeOut: number;
    /** Maximum time in seconds that a meditation is allowed to continue for before the connection is closed */
    maxLength: number;
  };
  openai: {
    instructions: string;
  };
  errorMessage: string;
};
