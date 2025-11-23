import { createConfig, http } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector';

/**
 * Wagmi configuration with Farcaster Mini App connector
 *
 * This config sets up wagmi to use the Farcaster wallet via the miniapp connector.
 * The connector will automatically use the Farcaster SDK wallet when available.
 */
export const wagmiConfig = createConfig({
  chains: [base, baseSepolia],
  connectors: [farcasterMiniApp()],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
});
