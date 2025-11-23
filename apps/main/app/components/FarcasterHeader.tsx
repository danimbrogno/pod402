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
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold">Z</span>
            </div>
            <h1 className="text-lg font-semibold text-slate-900">Zen Den</h1>
          </div>
          <div className="text-sm text-slate-500">Loading...</div>
        </div>
      </div>
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
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold">Z</span>
            </div>
            <h1 className="text-lg font-semibold text-slate-900">Zen Den</h1>
          </div>
          <div className="text-sm text-slate-500">Loading...</div>
        </div>
      </div>
    );
  }

  // Show user info if in mini app and context is available
  if (isInMiniApp && context?.user) {
    const { user } = context;
    // Safely access properties that may not be in type definitions
    const pfp = (user as any).pfp;
    const channel = (context as any).channel;

    return (
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold">Z</span>
            </div>
            <h1 className="text-lg font-semibold text-slate-900">Zen Den</h1>
          </div>
          <div className="flex items-center gap-3">
            {isConnected ? (
              <>
                {pfp?.url && (
                  <img
                    src={pfp.url}
                    alt={user.username || 'User'}
                    className="w-8 h-8 rounded-full ring-2 ring-indigo-100"
                  />
                )}
                <div className="flex flex-col items-end">
                  {user.username && (
                    <span className="text-sm font-medium text-slate-900">
                      @{user.username}
                    </span>
                  )}
                  {channel?.name && (
                    <span className="text-xs text-slate-500">
                      {channel.name}
                    </span>
                  )}
                </div>
              </>
            ) : (
              <button
                onClick={handleConnect}
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {isPending ? 'Connecting...' : 'Connect Wallet'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Fallback for web mode or when not in mini app
  return (
    <div className="container mx-auto px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold">Z</span>
          </div>
          <h1 className="text-lg font-semibold text-slate-900">Zen Den</h1>
        </div>
        <div className="flex items-center gap-3">
          {isConnected ? (
            <div className="text-sm text-slate-500">Web Mode</div>
          ) : (
            <button
              onClick={handleConnect}
              disabled={isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {isPending ? 'Connecting...' : 'Connect Wallet'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
