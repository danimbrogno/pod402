import { getAmbientAudio } from './components/getAmbientAudio';
import { Config } from '../../../../interface';
import { getAudioContext } from './components/getAudioContext';
import { transcode } from './components/transcode';
import { getNarration } from './components/narration/getNarration';
import { fadeOutAndEnd } from './components/fadeOutAndEnd';

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
  console.log('[buildEpisode] Starting episode build');

  // Initialize the audio engine
  const audioEngine = getAudioContext(config);
  console.log(
    `[buildEpisode] Audio context created, initial state: ${audioEngine.context.state}`
  );
  await audioEngine.context.resume();
  console.log(
    `[buildEpisode] Audio context resumed, state: ${audioEngine.context.state}, currentTime: ${audioEngine.context.currentTime}`
  );

  // Transcode the audio to mp3
  const transcoder = transcode(config, audioEngine.context);
  console.log('[buildEpisode] Transcoder created');

  // Use provided ambience or pick a random ambient audio file (001-013)
  let ambientNum: string;
  if (options?.ambience) {
    const ambienceNum = parseInt(options.ambience, 10);
    // Validate ambience is between 1-13
    if (isNaN(ambienceNum) || ambienceNum < 1 || ambienceNum > 13) {
      console.warn(
        `[buildEpisode] Invalid ambience value: ${options.ambience}, using random instead`
      );
      ambientNum = String(Math.floor(Math.random() * 13) + 1).padStart(3, '0');
    } else {
      ambientNum = String(ambienceNum).padStart(3, '0');
    }
  } else {
    ambientNum = String(Math.floor(Math.random() * 13) + 1).padStart(3, '0');
  }
  console.log(
    `[buildEpisode] Selected ambient audio: ${ambientNum}${
      options?.ambience ? ' (from query)' : ' (random)'
    }`
  );

  // Cleanup function for transcoder and audio context
  const cleanup = () => {
    console.log('[buildEpisode] Cleanup requested');
    if (transcoder) {
      try {
        if (typeof transcoder.kill === 'function') {
          transcoder.kill('SIGTERM');
        } else if (transcoder.ffmpegProc) {
          transcoder.ffmpegProc.kill('SIGTERM');
        }
      } catch (error) {
        // Ignore errors during cleanup
      }
    }
    if (audioEngine.context.state !== 'closed') {
      audioEngine.context.close();
    }
  };

  // Handler for when narration completes
  const onNarrationComplete = async () => {
    console.log('[buildEpisode] Narration completed, starting fadeout');

    const onPlaybackEnd = () => {
      console.log('[buildEpisode] Meditation completed');
      cleanup();
      onComplete?.();
    };

    fadeOutAndEnd(config, audioEngine.gain, audioEngine.context, onPlaybackEnd);
  };

  // Promise to track when first narration audio is ready
  let resolveFirstAudioReady: () => void;
  const firstAudioReadyPromise = new Promise<void>((resolve) => {
    resolveFirstAudioReady = resolve;
  });

  // Handler for when first narration audio is ready - unmute master gain and start ambient audio
  const onFirstAudioReady = () => {
    console.log('[buildEpisode] First narration audio ready, unmuting master gain and starting ambient audio...');
    
    // Unmute the master gain so audio starts streaming
    const currentTime = audioEngine.context.currentTime;
    audioEngine.masterGain.gain.setValueAtTime(1, currentTime);
    console.log('[buildEpisode] Master gain unmuted at', currentTime);
    
    // Start ambient audio now that first narration audio is ready
    getAmbientAudio(
      config,
      audioEngine.context,
      audioEngine.destination,
      ambientNum
    )
      .then(() => {
        console.log('[buildEpisode] Ambient audio started');
        resolveFirstAudioReady();
      })
      .catch((error) => {
        console.error('[buildEpisode] Failed to start ambient audio:', error);
        resolveFirstAudioReady(); // Resolve anyway to not block narration
      });
  };

  // Start narration generation
  console.log('[buildEpisode] Calling getNarration with:', {
    prompt: options?.prompt || 'default',
    voice: options?.voice || 'random',
    length,
    hasOnComplete: !!onNarrationComplete,
  });
  await getNarration(
    config,
    audioEngine.context,
    audioEngine.destination,
    {
      prompt: options?.prompt,
      voice: options?.voice,
      length,
    },
    onNarrationComplete,
    onFirstAudioReady
  );
  console.log(
    '[buildEpisode] getNarration returned (narration started in background)'
  );

  // Wait for first audio to be ready (and ambient to start) before continuing
  await firstAudioReadyPromise;
  console.log('[buildEpisode] First audio ready and ambient started');

  return {
    transcoder,
    cleanup,
    audioContext: audioEngine.context,
  };
};
