import { getAmbientAudio } from './components/getAmbientAudio';
import { PassThrough } from 'stream';
import { StreamConfig } from '../interface';
import { getAudioContext } from './components/getAudioContext';
import { transcode } from './components/transcode';
import { getNarration } from './components/narration/getNarration';

export const buildEpisode = async (config: StreamConfig, prompt: string) => {
  console.log('[buildEpisode] Starting episode build');

  // Initialize the audio engine
  const audioEngine = getAudioContext(config);

  // Make length 5 minutes
  await audioEngine.context.resume();
  console.log('[buildEpisode] Audio context resumed');

  // Transcode the audio to mp3
  const transcoder = transcode(config, audioEngine.context);
  console.log('[buildEpisode] Transcoder created');

  transcoder.on('end', () => {
    console.log(
      '[buildEpisode] Transcoder stream ended, closing audio context'
    );
    audioEngine.context.close();
  });

  transcoder.on('error', (error) => {
    console.error('[buildEpisode] Transcoder error:', error);
  });

  await getAmbientAudio(
    config,
    audioEngine.context,
    audioEngine.destination,
    '001'
  );
  console.log('[buildEpisode] Ambient audio started');

  const narrationCleanup = await getNarration(
    config,
    audioEngine.context,
    audioEngine.destination,
    prompt || 'Give me a meditation about gratitude'
  );
  console.log('[buildEpisode] Narration generation started');

  // Cleanup function to terminate all resources
  const cleanup = () => {
    console.log('[buildEpisode] Starting cleanup of all resources...');

    // Terminate narration
    if (narrationCleanup) {
      narrationCleanup();
    }

    // Kill transcoder/ffmpeg process
    if (transcoder) {
      console.log('[buildEpisode] Terminating transcoder/ffmpeg process');
      try {
        // fluent-ffmpeg streams can be killed using kill()
        if (typeof transcoder.kill === 'function') {
          transcoder.kill('SIGTERM');
        } else if (transcoder.ffmpegProc) {
          transcoder.ffmpegProc.kill('SIGTERM');
        }
        console.log('[buildEpisode] Transcoder process terminated');
      } catch (error) {
        console.error('[buildEpisode] Error terminating transcoder:', error);
      }
    }

    // Close audio context
    if (audioEngine.context.state !== 'closed') {
      console.log('[buildEpisode] Closing audio context');
      audioEngine.context.close();
    }

    console.log('[buildEpisode] All resources cleaned up');
  };

  const begin = async () => {
    console.log('start other things later');
    // await Promise.all([backgroundBufferSource.start()]);
  };

  return {
    transcoder,
    begin,
    cleanup,
    audioContext: audioEngine.context,
  };
};
