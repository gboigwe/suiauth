/**
 * Supported Sui network names
 */
export type NetworkName = 'mainnet' | 'testnet' | 'devnet' | 'localnet';

/**
 * Network configuration
 */
export interface NetworkConfig {
  name: NetworkName;
  url: string;
  websocketUrl?: string;
  faucetUrl?: string;
}

/**
 * Standard network configurations
 */
export const NETWORKS: Record<NetworkName, NetworkConfig> = {
  mainnet: {
    name: 'mainnet',
    url: 'https://fullnode.mainnet.sui.io:443',
    websocketUrl: 'wss://fullnode.mainnet.sui.io:443',
  },
  testnet: {
    name: 'testnet',
    url: 'https://fullnode.testnet.sui.io:443',
    websocketUrl: 'wss://fullnode.testnet.sui.io:443',
    faucetUrl: 'https://faucet.testnet.sui.io/gas',
  },
  devnet: {
    name: 'devnet',
    url: 'https://fullnode.devnet.sui.io:443',
    websocketUrl: 'wss://fullnode.devnet.sui.io:443',
    faucetUrl: 'https://faucet.devnet.sui.io/gas',
  },
  localnet: {
    name: 'localnet',
    url: 'http://localhost:9000',
    websocketUrl: 'ws://localhost:9000',
  },
};

/**
 * Utility function to get a network config by name
 * @param name Network name
 * @returns Network configuration
 */
export function getNetworkConfig(name: NetworkName): NetworkConfig {
  return NETWORKS[name];
}
