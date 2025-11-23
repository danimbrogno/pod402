/**
 * Example usage of useX402 hook with Farcaster wallet
 * 
 * This example shows how to use the useX402 hook to make paid API requests
 * using the Farcaster wallet client via wagmi.
 */

import { useX402 } from './useX402';

export function ExampleX402Usage() {
  const { fetchWithPayment, isReady, address, decodeXPaymentResponse } = useX402();

  const handlePaidRequest = async () => {
    if (!fetchWithPayment || !isReady) {
      console.error('Wallet not ready');
      return;
    }

    try {
      // Make a request to a paid endpoint
      // x402-fetch will automatically handle 402 Payment Required responses
      const response = await fetchWithPayment('https://api.example.com/paid-endpoint', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('Response data:', data);

      // Optionally decode the payment response header
      const paymentResponseHeader = response.headers.get('x-payment-response');
      if (paymentResponseHeader) {
        const paymentResponse = decodeXPaymentResponse(paymentResponseHeader);
        console.log('Payment response:', paymentResponse);
      }
    } catch (error) {
      console.error('Request failed:', error);
    }
  };

  if (!isReady) {
    return (
      <div>
        <p>Connecting wallet...</p>
        <p>Address: {address || 'Not connected'}</p>
      </div>
    );
  }

  return (
    <div>
      <p>Wallet connected: {address}</p>
      <button onClick={handlePaidRequest}>
        Make Paid Request
      </button>
    </div>
  );
}

