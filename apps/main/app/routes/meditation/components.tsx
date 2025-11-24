import { useNavigate } from 'react-router';
import { Button } from '~/components/ui/Button';
import { formatTime } from './helpers';

interface LoadingStateProps {
  isDemo?: boolean;
}

export function LoadingState({ isDemo = false }: LoadingStateProps) {
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

interface ErrorStateProps {
  error: string;
}

export function ErrorState({ error }: ErrorStateProps) {
  const navigate = useNavigate();
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

interface MeditationInfoProps {
  prompt: string;
  voiceName: string;
  ambienceName: string;
}

export function MeditationInfo({
  prompt,
  voiceName,
  ambienceName,
}: MeditationInfoProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 space-y-4">
      <div className="space-y-3">
        <div>
          <p className="text-xs text-stone-500 mb-1">Prompt</p>
          <p className="text-sm font-medium text-stone-900">{prompt}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-stone-500 mb-1">Voice</p>
            <p className="text-sm font-medium text-stone-900">{voiceName}</p>
          </div>
          <div>
            <p className="text-xs text-stone-500 mb-1">Ambience</p>
            <p className="text-sm font-medium text-stone-900">{ambienceName}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface PlaybackStatusProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  progress: number;
}

export function PlaybackStatus({
  isPlaying,
  currentTime,
  duration,
  progress,
}: PlaybackStatusProps) {
  return (
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
  );
}

interface MeditationLayoutProps {
  children: React.ReactNode;
  onStop: () => void;
  isPlaying: boolean;
}

export function MeditationLayout({
  children,
  onStop,
  isPlaying,
}: MeditationLayoutProps) {
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
        <div className="w-full max-w-md space-y-8">{children}</div>
      </div>

      {/* Fixed Footer with Stop Button */}
      <footer className="p-6 border-t border-stone-200 bg-white/95 backdrop-blur-md">
        <div className="max-w-md mx-auto">
          <Button variant="danger" fullWidth size="lg" onClick={onStop}>
            {isPlaying ? '⏹️ End Meditation' : 'Return Home'}
          </Button>
        </div>
      </footer>
    </div>
  );
}

interface GenerationScreenProps {
  prompt: string;
  voiceName: string;
  ambienceName: string;
  isLoading: boolean;
  isDemo?: boolean;
}

export function GenerationScreen({
  prompt,
  voiceName,
  ambienceName,
  isLoading,
  isDemo = false,
}: GenerationScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-stone-50 to-amber-50">
      <div className="w-full max-w-md space-y-8 px-6">
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

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-teal-100 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full border-4 border-teal-700 border-t-transparent animate-spin"></div>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-stone-900">
                {isDemo ? 'Loading Demo...' : 'Generating Your Meditation'}
              </h2>
              <p className="text-sm text-stone-600">
                {isDemo
                  ? 'Preparing your meditation experience...'
                  : 'Creating a personalized meditation just for you...'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
