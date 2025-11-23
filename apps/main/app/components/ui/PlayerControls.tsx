import { Button } from './Button';
import { Alert } from './Alert';

interface PlayerControlsProps {
  isPlaying: boolean;
  isLoading: boolean;
  onStop: () => void;
}

export function PlayerControls({
  isPlaying,
  isLoading,
  onStop,
}: PlayerControlsProps) {
  if (!isPlaying && !isLoading) return null;

  return (
    <Alert variant="success" className="mt-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium mb-1">
            {isLoading ? 'Generating meditation...' : 'Meditation is playing'}
          </p>
          {isPlaying && (
            <div className="w-full bg-emerald-200 rounded-full h-1.5 mt-2">
              <div className="bg-emerald-600 h-1.5 rounded-full animate-pulse w-full"></div>
            </div>
          )}
        </div>
        {isPlaying && (
          <Button
            variant="danger"
            size="sm"
            onClick={onStop}
            className="ml-4"
          >
            Stop
          </Button>
        )}
      </div>
    </Alert>
  );
}

