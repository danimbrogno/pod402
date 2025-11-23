import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type PropsWithChildren, useState } from 'react';
import { wagmiConfig } from '~/config/wagmi';

/**
 * WagmiProvider wrapper that includes React Query
 *
 * This provider sets up wagmi with the Farcaster connector and React Query
 * for state management. It should wrap your app components that need wallet access.
 *
 * According to wagmi docs: https://wagmi.sh/react/getting-started
 * QueryClientProvider should be inside WagmiProvider
 */
export function Web3ContextProvider({ children }: PropsWithChildren) {
  // Create a QueryClient instance for React Query
  // This is used by wagmi for caching and state management
  // Using useState ensures the QueryClient is stable across renders
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // With SSR, we usually want to set some default staleTime
            // above 0 to avoid refetching immediately on the client
            staleTime: 60 * 1000, // 1 minute
          },
        },
      }),
  );

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
