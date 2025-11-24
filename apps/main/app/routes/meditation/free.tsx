import { useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { useConfig } from '~/contexts/ConfigContext';
import { useMeditationAudio } from './context';
import {
  ErrorState,
  MeditationLayout,
  MeditationInfo,
  PlaybackStatus,
  GenerationScreen,
} from './components';
import { AMBIENCE_TRACKS, VOICE_LABELS } from './helpers';

export default function FreeMeditation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { demoEndpoint } = useConfig();
  const {
    play,
    stop,
    isPlaying,
    isLoading,
    error,
    currentTime,
    duration,
    progress,
  } = useMeditationAudio();
  const hasStartedRef = useRef(false);
  const streamUrlRef = useRef<string | null>(null);

  const prompt =
    searchParams.get('prompt') || 'Give me a meditation about gratitude';
  const voice = searchParams.get('voice') || 'nova';
  const ambience = searchParams.get('ambience') || '1';

  // Memoize streamUrl to prevent recalculation on every render
  const streamUrl = useMemo(() => {
    const params = new URLSearchParams({
      prompt,
      voice,
      ambience,
    });
    return `${demoEndpoint}?${params.toString()}`;
  }, [prompt, voice, ambience, demoEndpoint]);

  // Capture streamUrl at mount time
  if (streamUrlRef.current === null) {
    streamUrlRef.current = streamUrl;
  }

  // Start playback when component mounts - only once
  useEffect(() => {
    // Stop any existing audio first
    stop();

    if (hasStartedRef.current) {
      console.log('[FreeMeditation] Already started, skipping');
      return;
    }

    hasStartedRef.current = true;
    const urlToPlay = streamUrlRef.current || streamUrl;
    console.log('[FreeMeditation] Starting playback', { urlToPlay });

    const startPlayback = async () => {
      await play(urlToPlay);
    };

    startPlayback();

    // Reset on unmount so it can start again if navigated back
    return () => {
      hasStartedRef.current = false;
      streamUrlRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run on mount

  const handleStop = () => {
    stop();
    navigate('/');
  };

  const ambienceName = AMBIENCE_TRACKS[Number.parseInt(ambience)] || 'Unknown';
  const voiceName = VOICE_LABELS[voice] || voice;

  // Error state
  if (error) {
    return <ErrorState error={error} />;
  }

  // Show generation screen until playback starts
  if (!isPlaying && (isLoading || !hasStartedRef.current)) {
    return (
      <GenerationScreen
        prompt={prompt}
        voiceName={voiceName}
        ambienceName={ambienceName}
        isLoading={isLoading}
        isDemo={true}
      />
    );
  }

  // Playing state - full screen playback UI
  return (
    <MeditationLayout onStop={handleStop} isPlaying={isPlaying}>
      <MeditationInfo
        prompt={prompt}
        voiceName={voiceName}
        ambienceName={ambienceName}
      />
      <PlaybackStatus
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        progress={progress}
      />
    </MeditationLayout>
  );
}
