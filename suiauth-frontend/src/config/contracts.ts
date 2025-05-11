import { NetworkName } from '@/types/network';

interface ContractAddresses {
  suiAuth: string;
}

type NetworkAddresses = {
  [key in NetworkName]: ContractAddresses;
};

/**
 * Contract addresses for different networks
 */
const ADDRESSES: NetworkAddresses = {
  mainnet: {
    suiAuth: '0x0', // Replace with actual mainnet address when deployed
  },
  testnet: {
    suiAuth: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0xce1a60df180c3f9fed35e21fdcaba1c6c70972be7a61d69d51de50a0b55f0e24',
  },
  devnet: {
    suiAuth: '0x10c7a0a198544f8f07a1cb7dd6ee23b70e0b0d3cefd5efe10a8b7b921b50dc2f',
  },
  localnet: {
    suiAuth: '0x0', // Replace with local dev address
  },
};

/**
 * Selected network from environment or default to testnet
 */
export const NETWORK = (process.env.NEXT_PUBLIC_SUI_NETWORK || 'testnet') as NetworkName;

/**
 * SuiAuth contract address for the selected network
 */
export const suiAuthContract = ADDRESSES[NETWORK].suiAuth;

/**
 * Get contract address for a specific network
 * @param contractKey Contract identifier
 * @param network Network name
 * @returns Contract address
 */
export function getContractAddress(
  contractKey: keyof ContractAddresses,
  network: NetworkName = NETWORK
): string {
  return ADDRESSES[network][contractKey];
}
