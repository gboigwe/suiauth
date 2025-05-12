'use client';

import { ReactNode } from 'react';
import { getFullnodeUrl } from '@mysten/sui/client';
import {
  SuiClientProvider,
  WalletProvider,
  ConnectButton as DappKitConnectButton
} from '@mysten/dapp-kit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NetworkName } from '@/types/network';

// Default network - can be overridden via environment variable
export const DEFAULT_NETWORK = (process.env.NEXT_PUBLIC_SUI_NETWORK || 'testnet') as NetworkName;

// Query client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

interface SuiProviderProps {
  children: ReactNode;
  network?: NetworkName;
}

/**
 * Provider component that wraps all necessary Sui-related providers
 */
export function SuiProvider({ children, network = DEFAULT_NETWORK }: SuiProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider 
        networks={{
          mainnet: { url: getFullnodeUrl('mainnet') },
          testnet: { url: getFullnodeUrl('testnet') },
          devnet: { url: getFullnodeUrl('devnet') },
          localnet: { url: 'http://localhost:9000' },
        }}
        defaultNetwork={network}
      >
        <WalletProvider autoConnect={true}>
          {children}
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}

// Export the ConnectButton component with a more friendly name
export function ConnectButton(props: any) {
  return <DappKitConnectButton {...props} />;
}
