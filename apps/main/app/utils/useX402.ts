import { useMemo } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { wrapFetchWithPayment, decodeXPaymentResponse } from 'x402-fetch';

/**
 * Hook to use x402 payment-enabled fetch with Farcaster wallet
 *
 * This hook integrates x402 payment handling with the Farcaster wallet client
 * via wagmi. It provides a fetch wrapper that automatically handles 402 Payment
 * Required responses and completes payment flows.
 *
 * Based on the x402 quickstart guide:
 * https://docs.cdp.coinbase.com/x402/quickstart-for-buyers
 *
 * @example
 * ```tsx
 * const { fetchWithPayment, isReady } = useX402();
 *
 * if (!isReady) return <div>Connecting wallet...</div>;
 *
 * const response = await fetchWithPayment('https://api.example.com/paid-endpoint');
 * const data = await response.json();
 *
 * // Check payment response if needed
 * const paymentResponse = decodeXPaymentResponse(
 *   response.headers.get('x-payment-response')!
 * );
 * ```
 *
 * @returns Object containing:
 * - `fetchWithPayment`: Wrapped fetch function that handles x402 payments (null if not ready)
 * - `isReady`: Boolean indicating if wallet is connected and ready
 * - `account`: The connected wallet account (viem Account type)
 * - `address`: The wallet address
 * - `decodeXPaymentResponse`: Helper function to decode payment response headers
 */
export function useX402() {
  // In wagmi v2, useAccount provides both address and isConnected
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

  return {
    fetchWithPayment,
    isReady: isConnected && !!walletClient && !!fetchWithPayment,
    account: walletClient?.account, // Keep for backwards compatibility
    address,
    decodeXPaymentResponse, // Export the decoder for convenience
  };
}
