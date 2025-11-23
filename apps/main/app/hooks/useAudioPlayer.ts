import { useRef, useEffect, useState, useCallback } from 'react';

export type UseAudioPlayerReturn = {
  play: (url: string, fetchFn?: typeof fetch) => Promise<void>;
  stop: () => void;
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
};

/**
 * Reusable hook for audio playback
 */
export function useAudioPlayer(): UseAudioPlayerReturn {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = '';
      setIsPlaying(false);
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  }, []);

  const play = useCallback(
    async (url: string, fetchFn: typeof fetch = fetch) => {
      // Stop any currently playing audio
      stop();

      setIsLoading(true);
      setError(null);
      setIsPlaying(false);

      try {
        // Make the request
        const response = await fetchFn(url, {
          method: 'GET',
        });

        if (!response.ok) {
          throw new Error(
            `Request failed: ${response.status} ${response.statusText}`,
          );
        }

        // Get the audio data as ArrayBuffer
        const arrayBuffer = await response.arrayBuffer();

        // Get content type for proper blob creation
        const contentType =
          response.headers.get('Content-Type') || 'audio/mpeg';

        // Create blob from the audio data
        const blob = new Blob([arrayBuffer], { type: contentType });
        const blobUrl = URL.createObjectURL(blob);
        blobUrlRef.current = blobUrl;

        // Create a new Audio element for this playback
        const audio = new Audio(blobUrl);
        audioRef.current = audio;

        // Set up event handlers
        audio.onloadstart = () => {
          setIsLoading(true);
        };

        audio.oncanplay = () => {
          setIsLoading(false);
          // Try to play, but don't fail if autoplay is blocked
          audio.play().catch((err) => {
            console.log('Autoplay prevented, user interaction required:', err);
          });
        };

        audio.onplay = () => {
          setIsPlaying(true);
          setIsLoading(false);
        };

        audio.onpause = () => {
          setIsPlaying(false);
        };

        audio.onended = () => {
          setIsPlaying(false);
          if (blobUrlRef.current) {
            URL.revokeObjectURL(blobUrlRef.current);
            blobUrlRef.current = null;
          }
          audioRef.current = null;
        };

        audio.onerror = (e) => {
          console.error('Audio playback error:', e);
          setError('Audio playback failed');
          setIsPlaying(false);
          setIsLoading(false);
        };
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load audio');
        console.error('Error loading audio:', err);
        setIsLoading(false);
        setIsPlaying(false);
      }
    },
    [stop],
  );

  return {
    play,
    stop,
    isPlaying,
    isLoading,
    error,
  };
}
