import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { useX402 } from '~/utils/useX402';
import { useConfig } from '~/contexts/ConfigContext';
import { useAudioPlayer } from '~/hooks/useAudioPlayer';
import { Button } from '~/components/ui/Button';

// Meditation-themed ambient track names (same as welcome)
const AMBIENCE_TRACKS: Record<number, string> = {
  1: 'Ocean Waves',
  2: 'Forest Rain',
  3: 'Mountain Breeze',
  4: 'Desert Wind',
  5: 'Tibetan Bells',
  6: 'Crystal Cave',
  7: 'Zen Garden',
  8: 'Morning Mist',
  9: 'Evening Calm',
  10: 'Sacred Space',
  11: 'Inner Peace',
  12: 'Cosmic Drift',
  13: 'Eternal Flow',
};

const VOICE_LABELS: Record<string, string> = {
  alloy: 'Alloy',
  echo: 'Echo',
  fable: 'Fable',
  onyx: 'Onyx',
  nova: 'Nova',
  shimmer: 'Shimmer',
};

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function Meditation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { fetchWithPayment, isReady } = useX402();
  const { streamEndpoint, demoEndpoint } = useConfig();
  const {
    play,
    stop,
    isPlaying,
    isLoading,
    error,
    currentTime,
    duration,
    progress,
  } = useAudioPlayer();
  const [hasStarted, setHasStarted] = useState(false);

  const prompt =
    searchParams.get('prompt') || 'Give me a meditation about gratitude';
  const voice = searchParams.get('voice') || 'nova';
  const ambience = searchParams.get('ambience') || '1';
  const isDemo = searchParams.get('demo') === 'true';

  // Start playback when component mounts
  useEffect(() => {
    if (hasStarted) return;

    const startPlayback = async () => {
      setHasStarted(true);

      if (isDemo) {
        // Demo doesn't require wallet connection
        await play(demoEndpoint);
      } else {
        // Generate meditation requires payment
        if (!fetchWithPayment || !isReady) {
          // Redirect back if not ready
          navigate('/');
          return;
        }

        const params = new URLSearchParams({
          prompt,
          voice,
          ambience,
        });
        const streamUrl = `${streamEndpoint}?${params.toString()}`;
        await play(streamUrl, fetchWithPayment as typeof fetch);
      }
    };

    startPlayback();
  }, [
    hasStarted,
    isDemo,
    prompt,
    voice,
    ambience,
    streamEndpoint,
    demoEndpoint,
    fetchWithPayment,
    isReady,
    play,
    navigate,
  ]);

  const handleStop = () => {
    stop();
    navigate('/');
  };

  const ambienceName = AMBIENCE_TRACKS[Number.parseInt(ambience)] || 'Unknown';
  const voiceName = VOICE_LABELS[voice] || voice;

  // Loading state
  if (isLoading && !isPlaying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-stone-50 to-amber-50">
        <div className="text-center space-y-6 px-4">
          <div className="w-24 h-24 mx-auto rounded-full bg-teal-100 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full border-4 border-teal-700 border-t-transparent animate-spin"></div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-stone-900">
              {isDemo ? 'Loading Demo...' : 'Generating Your Meditation'}
            </h2>
            <p className="text-stone-600">
              {isDemo
                ? 'Preparing your meditation experience...'
                : 'Creating a personalized meditation just for you...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-stone-50 to-amber-50">
        <div className="text-center space-y-6 px-4 max-w-md">
          <div className="w-24 h-24 mx-auto rounded-full bg-rose-100 flex items-center justify-center">
            <span className="text-4xl">⚠️</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-stone-900">
              Something went wrong
            </h2>
            <p className="text-stone-600">{error}</p>
          </div>
          <Button onClick={() => navigate('/')} variant="primary">
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  // Playing state - full screen playback UI
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-amber-50 via-stone-50 to-amber-50">
      {/* Header */}
      <div className="p-6 text-center">
        <h1 className="text-3xl font-bold text-stone-900 mb-2">
          Your Meditation
        </h1>
        <p className="text-stone-600">Take a moment to breathe and relax</p>
      </div>

      {/* Main Content - Centered */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-md space-y-8">
          {/* Meditation Info Card */}
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 space-y-4">
            <div className="space-y-3">
              <div>
                <p className="text-xs text-stone-500 mb-1">Prompt</p>
                <p className="text-sm font-medium text-stone-900">{prompt}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-stone-500 mb-1">Voice</p>
                  <p className="text-sm font-medium text-stone-900">
                    {voiceName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-stone-500 mb-1">Ambience</p>
                  <p className="text-sm font-medium text-stone-900">
                    {ambienceName}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Playback Status */}
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 space-y-4">
            <div className="text-center space-y-3">
              <div className="w-20 h-20 mx-auto rounded-full bg-teal-100 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-teal-700 flex items-center justify-center">
                  <span className="text-2xl">🎵</span>
                </div>
              </div>
              <div>
                <p className="text-lg font-semibold text-stone-900">
                  {isPlaying ? 'Playing...' : 'Ready'}
                </p>
                <p className="text-sm text-stone-600">
                  {isPlaying ? 'Enjoy your meditation' : 'Press play to begin'}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            {(isPlaying || duration > 0) && (
              <div className="space-y-2">
                <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-teal-700 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-stone-500">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fixed Footer with Stop Button */}
      <footer className="p-6 border-t border-stone-200 bg-white/95 backdrop-blur-md">
        <div className="max-w-md mx-auto">
          <Button
            variant="danger"
            fullWidth
            size="lg"
            onClick={handleStop}
            disabled={!isPlaying && !isLoading}
          >
            {isPlaying ? '⏹️ Stop Meditation' : 'Return Home'}
          </Button>
        </div>
      </footer>
    </div>
  );
}
