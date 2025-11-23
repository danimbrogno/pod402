import { useEffect } from 'react';
import { startTransition, StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { HydratedRouter } from 'react-router/dom';
import { FarcasterSDKProvider } from './contexts/FarcasterSDKContext';
import { Web3ContextProvider } from './providers/Web3ContextProvider';

function ClientOnly({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const load = async () => {
      // Initialize Eruda console debugger (development only)
      if (process.env.NODE_ENV === 'development') {
        try {
          const eruda = await import('eruda');
          // eruda.default.init();
          console.log('Eruda console debugger initialized');
        } catch (error) {
          console.warn('Failed to initialize Eruda:', error);
        }
      }
    };
    load();
  }, []);

  return children;
}

startTransition(() => {
  console.log('hydrating');
  hydrateRoot(
    document,
    <StrictMode>
      <ClientOnly>
        <FarcasterSDKProvider>
          <Web3ContextProvider>
            <HydratedRouter />
          </Web3ContextProvider>
        </FarcasterSDKProvider>
      </ClientOnly>
    </StrictMode>,
  );
});
