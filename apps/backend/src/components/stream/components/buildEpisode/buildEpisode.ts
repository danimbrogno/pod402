import { getAmbientAudio } from './components/getAmbientAudio';
import { Config } from '../../../../interface';
import { getAudioContext } from './components/getAudioContext';
import { transcode } from './components/transcode';
import { getNarration } from './components/narration/getNarration';
import { fadeOutAndEnd } from './components/fadeOutAndEnd';

export const buildEpisode = async (
  config: Config,
  prompt: string,
  onComplete?: () => void
) => {
  console.log('[buildEpisode] Starting episode build');

  // Initialize the audio engine
  const audioEngine = getAudioContext(config);
  await audioEngine.context.resume();
  console.log('[buildEpisode] Audio context resumed');

  // Transcode the audio to mp3
  const transcoder = transcode(config, audioEngine.context);
  console.log('[buildEpisode] Transcoder created');

  // Pick a random background audio file (001-013)
  const randomBackgroundNum = String(
    Math.floor(Math.random() * 13) + 1
  ).padStart(3, '0');
  console.log(
    `[buildEpisode] Selected random background audio: ${randomBackgroundNum}`
  );

  // Load ambient audio
  console.log('[buildEpisode] Loading ambient audio...');
  await getAmbientAudio(
    config,
    audioEngine.context,
    audioEngine.destination,
    randomBackgroundNum
  );
  console.log('[buildEpisode] Ambient audio started');

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

  // Start narration generation
  await getNarration(
    config,
    audioEngine.context,
    audioEngine.destination,
    prompt || 'Give me a meditation about gratitude',
    onNarrationComplete
  );
  console.log('[buildEpisode] Narration generation started');

  return {
    transcoder,
    cleanup,
    audioContext: audioEngine.context,
  };
};
