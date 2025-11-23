import { useEffect, useState } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';
import { type MiniAppContext } from '@farcaster/miniapp-core/dist/context';

/**
 * Hook to access Farcaster Mini App SDK
 * Provides access to user context, actions, and other SDK features
 */
export function useFarcaster() {
  const [context, setContext] = useState<MiniAppContext | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Get initial context
    sdk.context
      .then((ctx) => {
        setContext(ctx);
        setIsReady(true);
      })
      .catch((error) => {
        console.error('Failed to get Farcaster context:', error);
        setIsReady(true);
      });
  }, []);

  return {
    context,
    isReady,
    sdk,
  };
}
