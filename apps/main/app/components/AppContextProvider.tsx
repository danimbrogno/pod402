// import { type Context as FrameContext } from '@farcaster/miniapp-core';
// import { sdk } from '@farcaster/miniapp-sdk';
// // import { isFunction } from 'lodash-es';
// import {
//   type PropsWithChildren,
//   createContext,
//   useContext,
//   useEffect,
//   useMemo,
//   useState,
// } from 'react';
// import type { CreateConnectorFn } from 'wagmi';

// export type Context =
//   | {
//       mode: 'web';
//     }
//   | {
//       mode: 'mini-app';
//       context: FrameContext.MiniAppContext;
//       connector: CreateConnectorFn;
//     };

// const context = createContext<Context | undefined>(undefined);

// export const AppContextProvider = ({ children }: PropsWithChildren) => {
//   const [connector, setConnector] = useState<CreateConnectorFn>();
//   const [isMiniApp, setIsMiniApp] = useState(false);
//   const [sdkContext, setSdkContext] = useState<FrameContext.MiniAppContext>();
//   const [isSDKLoaded, setIsSDKLoaded] = useState(false);

//   // useEffect(() => {
//   //   console.log('checking is mini app');
//   //   if (isMiniApp) {
//   //     console.log('yes it is');
//   //     import('@farcaster/miniapp-wagmi-connector').then((mod) => {
//   //       if (mod.default && isFunction(mod.default)) {
//   //         setConnector(mod.default);
//   //       }
//   //     });
//   //   }
//   // }, [isMiniApp]);
//   console.log('is sdk loaded', isSDKLoaded);
//   useEffect(() => {
//     console.log('runs this effect');
//     const load = async () => {
//       console.log('loading sdk');
//       const sdkContext = await sdk.context;
//       const isMiniApp = await sdk.isInMiniApp();
//       console.log('sdk context', sdkContext);
//       console.log('is mini app', isMiniApp);
//       setSdkContext(sdkContext);
//       setIsMiniApp(isMiniApp);
//       sdk.actions.ready();
//     };
//     console.log('checking sdk', sdk);
//     if (sdk && !isSDKLoaded) {
//       setIsSDKLoaded(true);
//       load();
//     }
//   }, [isSDKLoaded]);

//   const value: Context = useMemo(
//     () =>
//       connector && sdkContext && isMiniApp
//         ? {
//             mode: 'mini-app',
//             context: sdkContext,
//             connector,
//           }
//         : { mode: 'web' },
//     [connector, sdkContext, isMiniApp],
//   );

//   console.log('AppContext:', isMiniApp ? 'mini-app' : 'web');

//   return (
//     <context.Provider value={value}>
//       This is rendering. {children}
//     </context.Provider>
//   );
// };

// export const useAppContext = () => {

//   const ctx = useContext(context);
//   if (!ctx) {
//     throw new Error('useAppContext must be used within AppContextProvider');
//   }
//   return ctx;
// };
