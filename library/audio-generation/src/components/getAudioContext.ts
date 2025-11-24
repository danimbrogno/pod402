import { StreamAudioContext as StreamAudioContextType, Config } from '../types';

export type GetAudioContextDependencies = {
  createContext: () => StreamAudioContextType;
};

export const createGetAudioContext = (deps: GetAudioContextDependencies) => {
  return (config: Config) => {
    const context = deps.createContext();

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
  };
};
