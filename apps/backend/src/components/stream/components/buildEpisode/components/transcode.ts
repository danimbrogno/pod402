import { PassThrough } from 'stream';
import { getWavHeader } from './wav';
import { StreamAudioContext, Config } from '../../../../../interface';
import ffmpeg from 'fluent-ffmpeg';
import { logger } from '../../../../../utils/logger';

/**
 * Check if an error is an expected disconnect (client closed connection)
 */
function isExpectedDisconnect(error: Error): boolean {
  return (
    error.message === 'Output stream closed' ||
    error.message.includes('stream closed') ||
    error.message.includes('EPIPE') ||
    error.message.includes('ECONNRESET')
  );
}

export const transcode = (config: Config, context: StreamAudioContext) => {
  const transformer = new PassThrough();

  const wavHeader = getWavHeader({
    numFrames: 0, // We set 0 here since we don't know the length of our generated meditations.
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

  return ffmpeg(wav)
    .setFfmpegPath(ffmpegPath)
    .setFfprobePath(ffprobePath)
    .toFormat('mp3')
    .on('progress', (progress) => {
      logger.debug(`Transcode progress`, {
        component: 'transcode',
        progress,
      });
    })
    .on('error', (err: Error) => {
      if (isExpectedDisconnect(err)) {
        logger.debug(`Client disconnected (expected)`, {
          component: 'transcode',
        });
      } else {
        logger.error(`Transcoder error`, err, {
          component: 'transcode',
        });
      }
    });
};
