import { Config } from '../types';

export type FadeOutAndEndDependencies = {
  setTimeoutFn?: typeof setTimeout;
};

export const createFadeOutAndEnd = (
  deps: FadeOutAndEndDependencies = {}
) => {
  const setTimeoutImpl = deps.setTimeoutFn ?? setTimeout;

  return (
    config: Config,
    gain: GainNode,
    context: AudioContext,
    onPlaybackEnd?: () => void
  ): void => {
    const { fadeOut } = config.timing;
    gain.gain.value = 1;
    gain.gain.exponentialRampToValueAtTime(1, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0, context.currentTime + fadeOut);

    setTimeoutImpl(() => {
      if (context.state !== 'closed') {
        context.close();
      }
      onPlaybackEnd?.();
    }, fadeOut * 1000);
  };
};
