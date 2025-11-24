import { Config, StreamAudioContext } from './types';

export type GetAudioContextFn = (
  config: Config
) => {
  context: StreamAudioContext;
  gain: GainNode;
  destination: AudioNode;
};

export type TranscodeFn = (
  config: Config,
  context: StreamAudioContext
) => {
  kill?: (signal?: string) => void;
  ffmpegProc?: { kill: (signal?: string) => void };
};

export type GetAmbientAudioFn = (
  config: Config,
  context: AudioContext,
  destination: AudioNode,
  fileNum: string
) => Promise<AudioBufferSourceNode>;

export type GetNarrationFn = (
  config: Config,
  context: AudioContext,
  destination: AudioNode,
  narrationOptions: {
    prompt?: string;
    voice?: string;
    length?: number;
  },
  onComplete?: () => Promise<void> | void
) => Promise<() => void>;

export type FadeOutAndEndFn = (
  config: Config,
  gain: GainNode,
  context: AudioContext,
  onPlaybackEnd?: () => void
) => void;

export type BuildEpisodeDependencies = {
  getAudioContext: GetAudioContextFn;
  transcode: TranscodeFn;
  getAmbientAudio: GetAmbientAudioFn;
  getNarration: GetNarrationFn;
  fadeOutAndEnd: FadeOutAndEndFn;
  randomInt: (max: number) => number;
  logger?: Pick<typeof console, 'log' | 'warn'>;
};

export const createBuildEpisode = (deps: BuildEpisodeDependencies) => {
  const logger = deps.logger ?? console;

  const pickAmbientTrack = (requested?: string): string => {
    if (requested) {
      const parsed = Number.parseInt(requested, 10);
      if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= 13) {
        return String(parsed).padStart(3, '0');
      }
      logger.warn(
        `[buildEpisode] Invalid ambience value: ${requested}, using random instead`
      );
    }
    return String(deps.randomInt(13) + 1).padStart(3, '0');
  };

  return async (
    config: Config,
    length: number,
    onComplete?: () => void,
    options?: {
      prompt?: string;
      voice?: string;
      ambience?: string;
    }
  ) => {
    logger.log('[buildEpisode] Starting episode build');

    const audioEngine = deps.getAudioContext(config);
    logger.log(
      `[buildEpisode] Audio context created, initial state: ${audioEngine.context.state}`
    );
    await audioEngine.context.resume();
    logger.log(
      `[buildEpisode] Audio context resumed, state: ${audioEngine.context.state}, currentTime: ${audioEngine.context.currentTime}`
    );

    const transcoder = deps.transcode(config, audioEngine.context);
    logger.log('[buildEpisode] Transcoder created');

    const ambientNum = pickAmbientTrack(options?.ambience);
    logger.log(
      `[buildEpisode] Selected ambient audio: ${ambientNum}${
        options?.ambience ? ' (from query)' : ' (random)'
      }`
    );

    logger.log('[buildEpisode] Loading ambient audio...');
    await deps.getAmbientAudio(
      config,
      audioEngine.context,
      audioEngine.destination,
      ambientNum
    );
    logger.log('[buildEpisode] Ambient audio started');

    const cleanup = () => {
      logger.log('[buildEpisode] Cleanup requested');
      if (transcoder) {
        try {
          if (typeof transcoder.kill === 'function') {
            transcoder.kill('SIGTERM');
          } else if (transcoder.ffmpegProc) {
            transcoder.ffmpegProc.kill('SIGTERM');
          }
        } catch {
          // swallow cleanup errors
        }
      }
      if (audioEngine.context.state !== 'closed') {
        audioEngine.context.close();
      }
    };

    const onNarrationComplete = async () => {
      logger.log('[buildEpisode] Narration completed, starting fadeout');

      const onPlaybackEnd = () => {
        logger.log('[buildEpisode] Meditation completed');
        cleanup();
        onComplete?.();
      };

      deps.fadeOutAndEnd(
        config,
        audioEngine.gain,
        audioEngine.context,
        onPlaybackEnd
      );
    };

    logger.log('[buildEpisode] Calling getNarration with:', {
      prompt: options?.prompt || 'default',
      voice: options?.voice || 'random',
      length,
      hasOnComplete: !!onNarrationComplete,
    });
    await deps.getNarration(
      config,
      audioEngine.context,
      audioEngine.destination,
      {
        prompt: options?.prompt,
        voice: options?.voice,
        length,
      },
      onNarrationComplete
    );
    logger.log(
      '[buildEpisode] getNarration returned (narration started in background)'
    );

    return {
      transcoder,
      cleanup,
      audioContext: audioEngine.context,
    };
  };
};
