import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';
import type { MiniAppContext } from '@farcaster/miniapp-core/dist/context';

// Farcaster SDK Context
type FarcasterSDKContextType = {
  context: MiniAppContext | null;
  sdk: typeof import('@farcaster/miniapp-sdk').sdk | null;
  isInMiniApp: boolean;
};

const FarcasterSDKContext = createContext<FarcasterSDKContextType>({
  context: null,
  sdk: null,
  isInMiniApp: false,
});

export const useFarcasterSDK = () => {
  const context = useContext(FarcasterSDKContext);
  if (!context) {
    throw new Error('useFarcasterSDK must be used within FarcasterSDKProvider');
  }
  return context;
};

export function FarcasterSDKProvider({ children }: PropsWithChildren) {
  const [context, setContext] = useState<MiniAppContext | null>(null);
  const [sdk, setSdk] = useState<
    typeof import('@farcaster/miniapp-sdk').sdk | null
  >(null);
  const [isReady, setIsReady] = useState(false);
  const [isInMiniApp, setIsInMiniApp] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { sdk: farcasterSDK } = await import('@farcaster/miniapp-sdk');
        setSdk(farcasterSDK);

        // Get SDK context
        const sdkContext = await farcasterSDK.context;
        setContext(sdkContext);

        const isInMiniApp = await farcasterSDK.isInMiniApp();
        setIsInMiniApp(isInMiniApp);
        // Initialize Farcaster SDK and signal that the app is ready
        // This hides the splash screen and displays the app content
        await farcasterSDK.actions.ready();
        setIsReady(true);
      } catch (error) {
        console.error('Failed to initialize Farcaster SDK:', error);
        // Continue even if SDK initialization fails (e.g., when not in Farcaster)
        setIsReady(true);
      }
    };
    load();
  }, []);

  if (!isReady) {
    return <div>Loading...</div>;
  }
  return (
    <FarcasterSDKContext.Provider
      value={{
        context,
        sdk,
        isInMiniApp,
      }}
    >
      {children}
    </FarcasterSDKContext.Provider>
  );
}
