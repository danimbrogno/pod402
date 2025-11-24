import type { WavHeaderOptions } from './wav';
import { StreamAudioContext, Config } from '../types';

type PassThroughCtor = typeof import('stream').PassThrough;
type FfmpegFactory = typeof import('fluent-ffmpeg');
type GetWavHeaderFn = (options: WavHeaderOptions) => Uint8Array;

export type TranscodeDependencies = {
  PassThrough: PassThroughCtor;
  createFfmpegCommand: FfmpegFactory;
  getWavHeader: GetWavHeaderFn;
  logger?: Pick<typeof console, 'log' | 'error'>;
};

export const createTranscode = (deps: TranscodeDependencies) => {
  const logger = deps.logger ?? console;

  return (config: Config, context: StreamAudioContext) => {
    const transformer = new deps.PassThrough();

    const wavHeader = deps.getWavHeader({
      numFrames: 0,
      numChannels: config.channels,
      sampleRate: config.frequency,
      bytesPerSample: config.bytesPerSample,
      format: config.format,
    });

    transformer.push(wavHeader);

    const wav = context.pipe(transformer);

    const {
      ffmpeg: { ffmpegPath, ffprobePath },
    } = config;

    return deps
      .createFfmpegCommand(wav)
      .setFfmpegPath(ffmpegPath)
      .setFfprobePath(ffprobePath)
      .toFormat('mp3')
      .on('progress', function (progress) {
        logger.log({ progress }, `Render progress`);
      })
      .on('error', (err: Error) => {
        const isExpectedDisconnect =
          err.message === 'Output stream closed' ||
          err.message.includes('stream closed') ||
          err.message.includes('EPIPE') ||
          err.message.includes('ECONNRESET');

        if (isExpectedDisconnect) {
          logger.log(
            '[transcode] Client disconnected, output stream closed (expected)'
          );
        } else {
          logger.error('[transcode] Transcoder error:', err);
        }
      });
  };
};
