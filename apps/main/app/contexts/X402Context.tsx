import {
  createContext,
  useContext,
  useMemo,
  type PropsWithChildren,
} from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { wrapFetchWithPayment, decodeXPaymentResponse } from 'x402-fetch';
import type { WalletClient } from 'viem';

type X402ContextType = {
  fetchWithPayment: ReturnType<typeof wrapFetchWithPayment>;
  decodeXPaymentResponse: typeof decodeXPaymentResponse;
  address: string | undefined;
  account: WalletClient['account'] | undefined;
};

const X402Context = createContext<X402ContextType | null>(null);

/**
 * Provider that ensures walletClient is set before rendering children.
 * Once set, provides fetchWithPayment and other x402 utilities via context.
 */
export function X402Provider({ children }: PropsWithChildren) {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const fetchWithPayment = useMemo(() => {
    if (!walletClient) {
      return undefined;
    }

    // For x402-fetch, we need to pass the wallet client directly
    // Using type assertion as shown in the x402 example
    return wrapFetchWithPayment(
      fetch,
      walletClient as unknown as Parameters<typeof wrapFetchWithPayment>[1],
    );
  }, [walletClient]);

  // Don't render children until walletClient is ready
  if (!isConnected || !walletClient || !fetchWithPayment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="text-stone-600">Connecting wallet...</div>
        </div>
      </div>
    );
  }

  const value: X402ContextType = useMemo(
    () => ({
      fetchWithPayment,
      decodeXPaymentResponse,
      address,
      account: walletClient.account,
    }),
    [fetchWithPayment, address, walletClient.account],
  );

  return <X402Context.Provider value={value}>{children}</X402Context.Provider>;
}

/**
 * Hook to access the x402 context.
 * Must be used within an X402Provider.
 *
 * @returns Object containing:
 * - `fetchWithPayment`: Wrapped fetch function that handles x402 payments
 * - `decodeXPaymentResponse`: Helper function to decode payment response headers
 * - `address`: The wallet address
 * - `account`: The connected wallet account (viem Account type)
 */
export function useX402() {
  const context = useContext(X402Context);
  if (!context) {
    throw new Error('useX402 must be used within an X402Provider');
  }
  return context;
}
