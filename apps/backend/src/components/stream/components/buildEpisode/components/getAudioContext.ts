import { StreamAudioContext } from 'web-audio-engine';

import {
  StreamAudioContext as StreamAudioContextType,
  Config,
} from '../../../../../interface';
export function getAudioContext(config: Config) {
  const context = new StreamAudioContext() as StreamAudioContextType;

  const gain = context.createGain();
  gain.gain.value = 1;
  const compressor = context.createDynamicsCompressor();
  compressor.threshold.value = config.compressor.threshold;
  compressor.knee.value = config.compressor.knee;
  compressor.ratio.value = config.compressor.ratio;
  compressor.attack.value = config.compressor.attack;
  compressor.release.value = config.compressor.release;

  compressor.connect(gain).connect(context.destination);

  return { context, gain, destination: compressor };
}
