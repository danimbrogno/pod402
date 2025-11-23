import { createContext, useContext, type PropsWithChildren } from 'react';

export type Config = {
  streamEndpoint: string;
  demoEndpoint: string;
};

const ConfigContext = createContext<Config | null>(null);

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within ConfigProvider');
  }
  return context;
};

export function ConfigProvider({
  children,
  config,
}: PropsWithChildren<{ config: Config }>) {
  return (
    <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>
  );
}
