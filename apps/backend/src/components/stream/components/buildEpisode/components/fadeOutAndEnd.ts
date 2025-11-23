import { Config } from '../../../../../interface';
import { logger } from '../../../../../utils/logger';

export const fadeOutAndEnd = (
  config: Config,
  gain: GainNode,
  context: AudioContext,
  onPlaybackEnd?: () => void
): void => {
  const { fadeOut } = config.timing;

  logger.info(`Starting fadeout`, {
    component: 'fadeOutAndEnd',
    fadeOutDuration: `${fadeOut}s`,
  });

  gain.gain.value = 1;
  gain.gain.exponentialRampToValueAtTime(1, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0, context.currentTime + fadeOut);

  setTimeout(() => {
    if (context.state !== 'closed') {
      context.close();
    }
    if (onPlaybackEnd) {
      onPlaybackEnd();
    }
  }, fadeOut * 1000);
};
