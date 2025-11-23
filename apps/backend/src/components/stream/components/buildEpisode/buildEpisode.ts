import { getAmbientAudio } from './components/getAmbientAudio';
import { Config } from '../../../../interface';
import { getAudioContext } from './components/getAudioContext';
import { transcode } from './components/transcode';
import { getNarration } from './components/narration/getNarration';
import { fadeOutAndEnd } from './components/fadeOutAndEnd';
import { logger } from '../../../../utils/logger';
import { TimeoutManager } from '../../../../utils/timeoutManager';
import { AbortManager } from '../../../../utils/abortManager';

/**
 * Select ambient audio track number
 */
function selectAmbientTrack(ambienceOverride?: string): string {
  if (ambienceOverride) {
    const ambienceNum = parseInt(ambienceOverride, 10);
    if (!isNaN(ambienceNum) && ambienceNum >= 1 && ambienceNum <= 13) {
      return String(ambienceNum).padStart(3, '0');
    }
    logger.warn(`Invalid ambience value: ${ambienceOverride}, using random`, {
      component: 'buildEpisode',
    });
  }
  return String(Math.floor(Math.random() * 13) + 1).padStart(3, '0');
}

/**
 * Cleanup transcoder and audio context
 */
function cleanupResources(
  transcoder: ReturnType<typeof transcode>,
  audioContext: AudioContext
): void {
  logger.info(`Cleaning up resources`, {
    component: 'buildEpisode',
  });

  // Kill transcoder
  if (transcoder) {
    try {
      if (typeof transcoder.kill === 'function') {
        transcoder.kill('SIGTERM');
      } else if (transcoder.ffmpegProc) {
        transcoder.ffmpegProc.kill('SIGTERM');
      }
    } catch (error) {
      // Ignore errors during cleanup
      logger.debug(`Error killing transcoder (ignored)`, {
        component: 'buildEpisode',
      });
    }
  }

  // Close audio context
  if (audioContext.state !== 'closed') {
    try {
      audioContext.close();
    } catch (error) {
      logger.debug(`Error closing audio context (ignored)`, {
        component: 'buildEpisode',
      });
    }
  }
}

export const buildEpisode = async (
  config: Config,
  length: number,
  onComplete?: () => void,
  options?: {
    prompt?: string;
    voice?: string;
    ambience?: string;
  }
) => {
  logger.info(`Starting episode build`, {
    component: 'buildEpisode',
    length,
    prompt: options?.prompt || 'default',
    voice: options?.voice || 'random',
  });

  // Initialize the audio engine
  const audioEngine = getAudioContext(config);
  await audioEngine.context.resume();
  logger.debug(`Audio context initialized`, {
    component: 'buildEpisode',
    state: audioEngine.context.state,
  });

  // Transcode the audio to mp3
  const transcoder = transcode(config, audioEngine.context);

  // Select ambient track
  const ambientNum = selectAmbientTrack(options?.ambience);
  logger.info(`Selected ambient audio track`, {
    component: 'buildEpisode',
    track: ambientNum,
    source: options?.ambience ? 'query' : 'random',
  });

  // Load ambient audio
  await getAmbientAudio(
    config,
    audioEngine.context,
    audioEngine.destination,
    ambientNum
  );

  // Create abort manager for cleanup
  const abortManager = new AbortManager();

  // Create timeout manager for hard stop failsafe
  const timeoutManager = new TimeoutManager(config.timing.maxLength, () => {
    logger.warn(`Hard stop triggered: max duration exceeded`, {
      component: 'buildEpisode',
      maxDuration: config.timing.maxLength,
    });
    abortManager.abort();
    cleanupResources(transcoder, audioEngine.context);
    onComplete?.();
  });
  timeoutManager.start();

  // Cleanup function
  const cleanup = () => {
    timeoutManager.stop();
    cleanupResources(transcoder, audioEngine.context);
  };

  // Register cleanup on abort
  abortManager.onAbort(cleanup);

  // Handler for when narration completes
  const onNarrationComplete = async () => {
    logger.info(`Narration completed, starting fadeout`, {
      component: 'buildEpisode',
      elapsed: `${timeoutManager.getElapsed().toFixed(1)}s`,
    });

    const onPlaybackEnd = () => {
      logger.info(`Meditation completed`, {
        component: 'buildEpisode',
        totalDuration: `${timeoutManager.getElapsed().toFixed(1)}s`,
      });
      cleanup();
      onComplete?.();
    };

    fadeOutAndEnd(config, audioEngine.gain, audioEngine.context, onPlaybackEnd);
  };

  // Start narration generation
  const narrationCleanup = await getNarration(
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

  // Register narration cleanup on abort
  abortManager.onAbort(() => {
    narrationCleanup();
  });

  return {
    transcoder,
    cleanup,
    audioContext: audioEngine.context,
    abortManager,
  };
};
