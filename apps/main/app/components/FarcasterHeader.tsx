import { useFarcasterSDK } from '~/contexts/FarcasterSDKContext';
import { useConnect, useConnectors, useAccount } from 'wagmi';
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector';

/**
 * Header component that displays Farcaster user information
 * This is a client-only component since it uses the Farcaster SDK context
 */
export function FarcasterHeader() {
  // Safety check: only render on client
  if (typeof window === 'undefined') {
    return (
      <header className="border-b border-gray-200 bg-white">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">Zen Den</h1>
            <div className="text-sm text-gray-500">Loading...</div>
          </div>
        </div>
      </header>
    );
  }

  const { context, sdk, isInMiniApp } = useFarcasterSDK();

  // Use wagmi hooks - these will throw if not inside WagmiProvider
  // In wagmi v2, useAccount provides connection status instead of useConnection
  const { connect, isPending } = useConnect();
  const connectors = useConnectors();
  const { isConnected } = useAccount();

  // Get the Farcaster connector
  const farcasterConnector =
    connectors.find(
      (connector) =>
        connector.id === 'farcasterMiniApp' ||
        connector.type === 'farcasterMiniApp',
    ) || farcasterMiniApp();

  const handleConnect = () => {
    connect({ connector: farcasterConnector });
  };

  // Show loading state while SDK initializes
  if (!sdk) {
    return (
      <header className="border-b bg-blue-500">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">Zen Den</h1>
            <div className="text-sm text-gray-500">Loading...</div>
          </div>
        </div>
      </header>
    );
  }

  // Show user info if in mini app and context is available
  if (isInMiniApp && context?.user) {
    const { user } = context;
    // Safely access properties that may not be in type definitions
    const pfp = (user as any).pfp;
    const channel = (context as any).channel;

    return (
      <header className="border-b border-gray-200 bg-blue-500 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">Zen Den</h1>
            <div className="flex items-center gap-3">
              {isConnected ? (
                <>
                  {pfp?.url && (
                    <img
                      src={pfp.url}
                      alt={user.username || 'User'}
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <div className="flex flex-col items-end">
                    {user.username && (
                      <span className="text-sm font-medium text-gray-900">
                        @{user.username}
                      </span>
                    )}
                    {channel?.name && (
                      <span className="text-xs text-gray-500">
                        {channel.name}
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <button
                  onClick={handleConnect}
                  disabled={isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? 'Connecting...' : 'Connect Wallet'}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
    );
  }

  // Fallback for web mode or when not in mini app
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Zen Den</h1>
          <div className="flex items-center gap-3">
            {isConnected ? (
              <div className="text-sm text-gray-500">Web Mode</div>
            ) : (
              <button
                onClick={handleConnect}
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? 'Connecting...' : 'Connect Wallet'}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
