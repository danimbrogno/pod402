import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from 'react';
import { useAudioPlayer } from '~/hooks/useAudioPlayer';

type MeditationAudioContextType = {
  play: (url: string, fetchFn?: typeof fetch) => Promise<void>;
  stop: () => void;
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
  currentTime: number;
  duration: number;
  progress: number;
  isReady: boolean;
};

const MeditationAudioContext = createContext<MeditationAudioContextType | null>(
  null,
);

/**
 * Provider that wraps meditation routes with a stable audio context.
 * The audio player is initialized once and persists across route changes.
 */
export function MeditationAudioProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize the audio player hook - this is stable and won't re-initialize
  // as long as the provider doesn't unmount
  const audioPlayer = useAudioPlayer();

  // Track if the audio context is ready
  const [isReady] = useState(true);

  // Track the currently playing URL to prevent duplicate calls
  const playingUrlRef = useRef<string | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioPlayer.stop();
      playingUrlRef.current = null;
    };
  }, [audioPlayer]);

  // Store stable references to audioPlayer methods and state
  const playAudioRef = useRef(audioPlayer.play);
  const stopAudioRef = useRef(audioPlayer.stop);
  const isPlayingRef = useRef(audioPlayer.isPlaying);
  const isLoadingRef = useRef(audioPlayer.isLoading);

  // Update refs when they change
  playAudioRef.current = audioPlayer.play;
  stopAudioRef.current = audioPlayer.stop;
  isPlayingRef.current = audioPlayer.isPlaying;
  isLoadingRef.current = audioPlayer.isLoading;

  // Wrapper for play that prevents duplicate calls for the same URL
  // Use refs to avoid recreating on every audioPlayer change
  const play = useCallback(
    async (url: string, fetchFn?: typeof fetch) => {
      // If already playing or loading the same URL, don't start again
      if (
        playingUrlRef.current === url &&
        (isPlayingRef.current || isLoadingRef.current)
      ) {
        console.log(
          '[MeditationAudioProvider] Already playing/loading this URL, skipping',
          {
            url,
            isPlaying: isPlayingRef.current,
            isLoading: isLoadingRef.current,
          },
        );
        return;
      }

      console.log('[MeditationAudioProvider] Starting playback', { url });
      playingUrlRef.current = url;
      await playAudioRef.current(url, fetchFn);
    },
    [], // Empty deps - use refs instead
  );

  // Wrapper for stop that clears the playing URL
  const stop = useCallback(() => {
    playingUrlRef.current = null;
    stopAudioRef.current();
  }, []); // Empty deps - use refs instead

  // Memoize the context value to prevent unnecessary re-renders
  // Only recreate when audio player state actually changes
  const value: MeditationAudioContextType = useMemo(
    () => ({
      play,
      stop,
      isPlaying: audioPlayer.isPlaying,
      isLoading: audioPlayer.isLoading,
      error: audioPlayer.error,
      currentTime: audioPlayer.currentTime,
      duration: audioPlayer.duration,
      progress: audioPlayer.progress,
      isReady,
    }),
    [
      play,
      stop,
      audioPlayer.isPlaying,
      audioPlayer.isLoading,
      audioPlayer.error,
      audioPlayer.currentTime,
      audioPlayer.duration,
      audioPlayer.progress,
      isReady,
    ],
  );

  return (
    <MeditationAudioContext.Provider value={value}>
      {children}
    </MeditationAudioContext.Provider>
  );
}

/**
 * Hook to access the meditation audio context.
 * Must be used within a MeditationAudioProvider.
 */
export function useMeditationAudio() {
  const context = useContext(MeditationAudioContext);
  if (!context) {
    throw new Error(
      'useMeditationAudio must be used within a MeditationAudioProvider',
    );
  }
  return context;
}
