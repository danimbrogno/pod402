import { startTransition, StrictMode, useEffect } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { HydratedRouter } from 'react-router/dom';

startTransition(() => {
  console.log('hydrating');
  hydrateRoot(
    document,
    <StrictMode>
      <ClientOnly>
        <HydratedRouter />
      </ClientOnly>
    </StrictMode>,
  );
});

function ClientOnly({ children }: { children: React.ReactNode }) {
  /**
   * This function is called after the app has been hydrated on the client.
   * Initialize Farcaster Mini App SDK here.
   */
  console.log('gets included!');

  useEffect(() => {
    console.log('hyrdating');
    const load = async () => {
      // Initialize Eruda console debugger (development only)
      if (process.env.NODE_ENV === 'development') {
        try {
          const eruda = await import('eruda');
          eruda.default.init();
          console.log('Eruda console debugger initialized');
        } catch (error) {
          console.warn('Failed to initialize Eruda:', error);
        }
      }
    };
    load();
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const { sdk } = await import('@farcaster/miniapp-sdk');
        // Initialize Farcaster SDK and signal that the app is ready
        // This hides the splash screen and displays the app content
        await sdk.actions.ready();
      } catch (error) {
        console.error('Failed to initialize Farcaster SDK:', error);
        // Continue even if SDK initialization fails (e.g., when not in Farcaster)
      }
    };
    load();
  }, []);

  return children;
}
