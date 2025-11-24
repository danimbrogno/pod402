import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router';

import { useConfig } from '~/contexts/ConfigContext';
import { LoadingState, ErrorState } from './components';
import { useX402 } from '~/contexts/X402Context';

export default function PaidMeditation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { fetchWithPayment } = useX402();
  const { streamEndpoint } = useConfig();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);

  const prompt =
    searchParams.get('prompt') || 'Give me a meditation about gratitude';
  const voice = searchParams.get('voice') || 'nova';
  const ambience = searchParams.get('ambience') || '1';

  // Call x402 endpoint when component mounts
  useEffect(() => {
    if (hasStarted) return;

    const fetchUrl = async () => {
      setHasStarted(true);
      setIsLoading(true);
      setError(null);

      // fetchWithPayment is guaranteed to be available by X402Provider

      try {
        debugger;
        const params = new URLSearchParams({
          prompt,
          voice,
          ambience,
        });
        const requestUrl = `${streamEndpoint}?${params.toString()}`;

        // Call the x402 endpoint - it will return JSON with { url: "..." }
        const response = await fetchWithPayment(requestUrl);

        if (!response.ok) {
          throw new Error(
            `Request failed: ${response.status} ${response.statusText}`,
          );
        }

        const data = await response.json();
        const meditationUrl = data.url;

        if (!meditationUrl) {
          throw new Error('No URL returned from server');
        }

        // Navigate to result screen with the URL
        navigate(`/meditation/result?url=${encodeURIComponent(meditationUrl)}`);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to get meditation URL',
        );
        setIsLoading(false);
      }
    };

    fetchUrl();
  }, [
    hasStarted,
    prompt,
    voice,
    ambience,
    streamEndpoint,
    fetchWithPayment,
    navigate,
  ]);

  // Loading state
  if (isLoading) {
    return <LoadingState isDemo={false} />;
  }

  // Error state
  if (error) {
    return <ErrorState error={error} />;
  }

  // Should not reach here, but just in case
  return null;
}
