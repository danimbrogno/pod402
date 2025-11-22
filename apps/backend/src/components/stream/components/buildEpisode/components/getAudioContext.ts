import { StreamAudioContext } from 'web-audio-engine';

import {
  StreamAudioContext as StreamAudioContextType,
  Config,
} from '../../../../../interface';
export function getAudioContext(config: Config) {
  const context = new StreamAudioContext() as StreamAudioContextType;

  // Master gain that controls when audio starts streaming (starts muted)
  const masterGain = context.createGain();
  masterGain.gain.value = 0; // Start muted - will be unmuted when first narration is ready
  
  const gain = context.createGain();
  gain.gain.value = 1;
  const compressor = context.createDynamicsCompressor();
  compressor.threshold.value = config.compressor.threshold;
  compressor.knee.value = config.compressor.knee;
  compressor.ratio.value = config.compressor.ratio;
  compressor.attack.value = config.compressor.attack;
  compressor.release.value = config.compressor.release;

  // Connect: masterGain -> gain -> compressor -> destination
  masterGain.connect(gain);
  compressor.connect(masterGain);
  gain.connect(context.destination);

  return { 
    context, 
    gain, 
    destination: compressor,
    masterGain // Expose master gain so we can unmute it when ready
  };
}
