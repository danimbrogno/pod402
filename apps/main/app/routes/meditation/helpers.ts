// Meditation-themed ambient track names
export const AMBIENCE_TRACKS: Record<number, string> = {
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

export const VOICE_LABELS: Record<string, string> = {
  alloy: 'Alloy',
  echo: 'Echo',
  fable: 'Fable',
  onyx: 'Onyx',
  nova: 'Nova',
  shimmer: 'Shimmer',
};

export function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
