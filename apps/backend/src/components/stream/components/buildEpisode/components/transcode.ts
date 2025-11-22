import Stream, { PassThrough } from 'stream';
import { getWavHeader } from './wav';
import { StreamAudioContext, StreamConfig } from '../../interface';
import ffmpeg from 'fluent-ffmpeg';
export const transcode = (
  config: StreamConfig,
  context: StreamAudioContext
) => {
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
    .on('progress', function (progress) {
      console.log({ progress }, `Render progress`);
    })
    .on('error', (err) => {
      console.error(err);
    });
};
