import { useSearchParams, useNavigate } from 'react-router';
import { Button } from '~/components/ui/Button';

export default function MeditationResult() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const url = searchParams.get('url');

  if (!url) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-stone-50 to-amber-50">
        <div className="text-center space-y-6 px-4 max-w-md">
          <div className="w-24 h-24 mx-auto rounded-full bg-rose-100 flex items-center justify-center">
            <span className="text-4xl">⚠️</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-stone-900">
              No URL provided
            </h2>
            <p className="text-stone-600">
              The meditation URL was not found in the request.
            </p>
          </div>
          <Button onClick={() => navigate('/')} variant="primary">
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-amber-50 via-stone-50 to-amber-50">
      {/* Header */}
      <div className="p-6 text-center">
        <h1 className="text-3xl font-bold text-stone-900 mb-2">
          Your Meditation is Ready
        </h1>
        <p className="text-stone-600">Access your personalized meditation</p>
      </div>

      {/* Main Content - Centered */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-md space-y-6">
          {/* URL Display Card */}
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 space-y-4">
            <div>
              <p className="text-xs text-stone-500 mb-2">Stream URL</p>
              <div className="bg-stone-50 rounded-lg p-3 border border-stone-200">
                <p className="text-sm font-mono text-stone-900 break-all">
                  {url}
                </p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 space-y-2">
            <h3 className="text-lg font-semibold text-stone-900">How to use</h3>
            <p className="text-sm text-stone-600">
              Copy this URL to access your meditation audio stream. You can use
              it in any audio player or meditation app.
            </p>
          </div>
        </div>
      </div>

      {/* Fixed Footer */}
      <footer className="p-6 border-t border-stone-200 bg-white/95 backdrop-blur-md">
        <div className="max-w-md mx-auto space-y-3">
          <Button
            variant="primary"
            fullWidth
            size="lg"
            onClick={() => {
              navigator.clipboard.writeText(url);
            }}
          >
            📋 Copy URL
          </Button>
          <Button variant="secondary" fullWidth onClick={() => navigate('/')}>
            Return Home
          </Button>
        </div>
      </footer>
    </div>
  );
}
