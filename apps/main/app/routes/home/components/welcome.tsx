import { useState } from 'react';
import { useX402 } from '~/utils/useX402';
import { useConfig } from '~/contexts/ConfigContext';
import { useAudioPlayer } from '~/hooks/useAudioPlayer';

type VoiceOption = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

const VOICE_OPTIONS: VoiceOption[] = [
  'alloy',
  'echo',
  'fable',
  'onyx',
  'nova',
  'shimmer',
];

export function Welcome() {
  const [prompt, setPrompt] = useState('Give me a meditation about gratitude');
  const [voice, setVoice] = useState<VoiceOption>('nova');
  const [ambience, setAmbience] = useState(1);
  const { fetchWithPayment, isReady } = useX402();
  const { streamEndpoint, demoEndpoint } = useConfig();
  const { play, stop, isPlaying, isLoading, error } = useAudioPlayer();

  const handleGenerateMeditation = async () => {
    if (!fetchWithPayment || !isReady) {
      return;
    }

    // Build query parameters
    const params = new URLSearchParams({
      prompt: prompt || 'Give me a meditation about gratitude',
      voice: voice,
      ambience: ambience.toString(),
    });

    const streamUrl = `${streamEndpoint}?${params.toString()}`;

    // Use the audio player hook to play the stream
    // Cast fetchWithPayment to match the expected type
    await play(streamUrl, fetchWithPayment as typeof fetch);
  };

  const handleStopPlayback = () => {
    stop();
  };

  const handlePlayDemo = async () => {
    // Demo doesn't require wallet connection, use regular fetch
    await play(demoEndpoint);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Meditation Settings
        </h2>

        <div className="space-y-6">
          {/* Prompt Text Input */}
          <div>
            <label
              htmlFor="prompt"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Prompt Text
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white"
              placeholder="Enter your meditation prompt or topic..."
            />
            <p className="mt-1 text-xs text-gray-500">
              Describe what kind of meditation you want (e.g., "gratitude",
              "mindfulness", "sleep", "anxiety relief")
            </p>
          </div>

          {/* Voice Selection */}
          <div>
            <label
              htmlFor="voice"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Voice
            </label>
            <select
              id="voice"
              value={voice}
              onChange={(e) => setVoice(e.target.value as VoiceOption)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white text-gray-900"
            >
              {VOICE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Select the voice for narration
            </p>
          </div>

          {/* Ambience Input */}
          <div>
            <label
              htmlFor="ambience"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Ambience
            </label>
            <input
              id="ambience"
              type="number"
              min="1"
              max="13"
              value={ambience}
              onChange={(e) => {
                const value = Number.parseInt(e.target.value) || 1;
                setAmbience(Math.max(1, Math.min(13, value)));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white"
            />
            <p className="mt-1 text-xs text-gray-500">
              Ambient background audio track number (1-13)
            </p>
          </div>

          {/* Display Current Settings */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Current Settings
            </h3>
            <div className="bg-gray-50 rounded-md p-3 text-sm text-gray-600 space-y-1">
              <p>
                <span className="font-medium">Prompt:</span>{' '}
                {prompt || '(empty)'}
              </p>
              <p>
                <span className="font-medium">Voice:</span> {voice}
              </p>
              <p>
                <span className="font-medium">Ambience:</span> {ambience}
              </p>
            </div>
          </div>

          {/* Demo and Generate Buttons */}
          <div className="pt-4 border-t border-gray-200 space-y-3">
            <button
              onClick={handlePlayDemo}
              disabled={isLoading}
              className="w-full px-4 py-3 bg-gray-600 text-white font-medium rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Loading Demo...' : 'Play Demo'}
            </button>

            <button
              onClick={handleGenerateMeditation}
              disabled={!isReady || isLoading}
              className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading
                ? 'Generating Meditation...'
                : !isReady
                  ? 'Connect Wallet to Generate'
                  : 'Generate Meditation ($0.01)'}
            </button>

            {error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {isPlaying && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-green-800">
                    Meditation is playing...
                  </p>
                  <button
                    onClick={handleStopPlayback}
                    className="px-3 py-1 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    Stop
                  </button>
                </div>
                <div className="w-full bg-green-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full animate-pulse"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
