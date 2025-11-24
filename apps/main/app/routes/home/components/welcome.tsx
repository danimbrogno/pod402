import { useState } from 'react';
import { useNavigate } from 'react-router';

import { useConfig } from '~/contexts/ConfigContext';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { Textarea } from '~/components/ui/Textarea';
import { Select } from '~/components/ui/Select';
import { Card } from '~/components/ui/Card';
import { Alert } from '~/components/ui/Alert';

type VoiceOption = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

const VOICE_OPTIONS: VoiceOption[] = [
  'alloy',
  'echo',
  'fable',
  'onyx',
  'nova',
  'shimmer',
];

const VOICE_LABELS: Record<VoiceOption, string> = {
  alloy: 'Alloy',
  echo: 'Echo',
  fable: 'Fable',
  onyx: 'Onyx',
  nova: 'Nova',
  shimmer: 'Shimmer',
};

// Meditation-themed ambient track names
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

const AMBIENCE_OPTIONS = Array.from({ length: 13 }, (_, i) => i + 1).map(
  (num) => ({
    value: num.toString(),
    label: AMBIENCE_TRACKS[num],
  }),
);

export function Welcome() {
  const [prompt, setPrompt] = useState('Give me a meditation about gratitude');
  const [voice, setVoice] = useState<VoiceOption>('nova');
  const [ambience, setAmbience] = useState('1');
  // Wallet is guaranteed to be ready by X402Provider
  const navigate = useNavigate();

  const handleGenerateMeditation = () => {
    // Navigate to paid meditation route with parameters
    const params = new URLSearchParams({
      prompt: prompt || 'Give me a meditation about gratitude',
      voice: voice,
      ambience: ambience,
    });

    navigate(`/meditation/paid?${params.toString()}`);
  };

  const handlePlayDemo = () => {
    // Navigate to free meditation route
    const params = new URLSearchParams({
      prompt: prompt || 'Give me a meditation about gratitude',
      voice: voice,
      ambience: ambience,
    });
    navigate(`/meditation/free?${params.toString()}`);
  };

  return (
    <div className="min-h-full py-6 px-4 pb-32">
      <div className="max-w-2xl mx-auto space-y-3">
        {/* Hero Section */}
        <div className="text-center space-y-2">
          <h1 className="text-xl font-bold text-stone-900">
            Create Your Meditation
          </h1>
        </div>

        {/* Main Form Card */}
        <Card>
          <div className="space-y-4">
            {/* Prompt Text Input */}
            <Textarea
              id="prompt"
              label="Meditation Prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              placeholder="Describe what kind of meditation you want..."
              helperText="Examples: 'gratitude', 'mindfulness', 'sleep', 'anxiety relief'"
            />

            {/* Voice and Ambience Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                id="voice"
                label="Voice"
                value={voice}
                onChange={(e) => setVoice(e.target.value as VoiceOption)}
                options={VOICE_OPTIONS.map((v) => ({
                  value: v,
                  label: VOICE_LABELS[v],
                }))}
                helperText="Narration voice style"
              />

              <Select
                id="ambience"
                label="Ambience Track"
                value={ambience}
                onChange={(e) => setAmbience(e.target.value)}
                options={AMBIENCE_OPTIONS}
                helperText="Choose your background soundscape"
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Fixed Footer with CTAs */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-stone-200/50 shadow-lg z-40">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="secondary" fullWidth onClick={handlePlayDemo}>
              🎧 Try Demo
            </Button>
            <Button
              variant="primary"
              fullWidth
              onClick={handleGenerateMeditation}
            >
              ✨ Generate Meditation ($0.01)
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
