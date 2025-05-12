import { 
  getZkLoginSignature, 
  generateNonce, 
  generateRandomness, 
  jwtToAddress,
  computeZkLoginAddress,
  genAddressSeed
} from '@mysten/sui/zklogin';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { fromHex } from '@mysten/sui/utils';
import { getLocalStorage, setLocalStorage, removeLocalStorage } from './storage';

export interface OAuthProvider {
  name: 'google' | 'facebook' | 'apple';
  displayName: string;
  clientId: string;
  scope?: string;
}

export const OAUTH_PROVIDERS: OAuthProvider[] = [
  {
    name: 'google',
    displayName: 'Google',
    clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
    scope: 'openid email profile',
  },
  // Add more providers as needed
];

/**
 * Gets the OAuth provider configuration by name
 */
export function getOAuthProvider(name: string): OAuthProvider | undefined {
  return OAUTH_PROVIDERS.find(provider => provider.name === name);
}

/**
 * Prepares zkLogin authentication flow
 */
export async function prepareZkLoginAuth(
  provider: OAuthProvider,
  redirectUrl: string,
  maxEpoch: number
): Promise<{
  url: string;
  nonce: string;
  keypair: Ed25519Keypair;
}> {
  // Generate a random ephemeral keypair
  const keypair = Ed25519Keypair.generate();
  const ephemeralPublicKey = keypair.getPublicKey();
  
  // Generate random value for the nonce
  const randomness = generateRandomness();
  
  // Generate nonce for zkLogin
  const nonce = generateNonce(ephemeralPublicKey, maxEpoch, randomness);
  
  // Prepare OAuth URL based on provider
  let authUrl: string;
  
  if (provider.name === 'google') {
    authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${
      provider.clientId
    }&response_type=id_token&redirect_uri=${
      encodeURIComponent(redirectUrl)
    }&scope=${
      encodeURIComponent(provider.scope || 'openid')
    }&nonce=${nonce}`;
  } else if (provider.name === 'facebook') {
    // Facebook configuration would go here
    throw new Error('Facebook provider not yet implemented');
  } else if (provider.name === 'apple') {
    // Apple configuration would go here
    throw new Error('Apple provider not yet implemented');
  } else {
    throw new Error(`Unsupported OAuth provider: ${provider.name}`);
  }
  
  return {
    url: authUrl,
    nonce,
    keypair,
  };
}

/**
 * Stores zkLogin session data in local storage
 */
export function storeZkLoginSession(
  keypair: Ed25519Keypair,
  maxEpoch: number,
  nonce: string
): void {
  // Get the secret key bytes directly using getSecretKey
  const privateKeyBytes = keypair.getSecretKey();
  setLocalStorage('zklogin_keypair', Buffer.from(privateKeyBytes).toString('base64'));
  setLocalStorage('zklogin_max_epoch', String(maxEpoch));
  setLocalStorage('zklogin_nonce', nonce);
}

/**
 * Gets stored zkLogin session data from local storage
 */
export function getZkLoginSession(): {
  keypair: Ed25519Keypair | null;
  maxEpoch: number | null;
  nonce: string | null;
} {
  const keypairData = getLocalStorage('zklogin_keypair');
  const maxEpochStr = getLocalStorage('zklogin_max_epoch');
  const nonce = getLocalStorage('zklogin_nonce');
  
  let keypair = null;
  if (keypairData) {
    try {
      // Create keypair from the stored private key
      const privateKeyBytes = Buffer.from(keypairData, 'base64');
      keypair = Ed25519Keypair.fromSecretKey(privateKeyBytes);
    } catch (error) {
      console.error('Error deserializing keypair:', error);
    }
  }
  
  return {
    keypair,
    maxEpoch: maxEpochStr ? parseInt(maxEpochStr) : null,
    nonce,
  };
}

/**
 * Clears zkLogin session data from local storage
 */
export function clearZkLoginSession(): void {
  removeLocalStorage('zklogin_keypair');
  removeLocalStorage('zklogin_max_epoch');
  removeLocalStorage('zklogin_nonce');
  removeLocalStorage('zklogin_salt');
  removeLocalStorage('zklogin_address');
  removeLocalStorage('zklogin_jwt');
}

/**
 * Parses JWT token from URL hash fragment or query parameters
 */
export function parseJwtFromUrl(): string | null {
  // First try to get from fragment/hash (common for implicit flow)
  if (typeof window !== 'undefined') {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const idToken = params.get('id_token');
    
    if (idToken) {
      return idToken;
    }
    
    // Then try to get from query parameters
    const queryParams = new URLSearchParams(window.location.search);
    const queryToken = queryParams.get('id_token');
    
    return queryToken;
  }
  
  return null;
}

/**
 * Gets or generates user salt for zkLogin
 */
export async function getUserSalt(userId: string): Promise<string> {
  const storedSalt = getLocalStorage(`zklogin_salt_${userId}`);
  if (storedSalt) return storedSalt;
  
  // If no salt exists, generate a new one
  const salt = generateRandomness();
  setLocalStorage(`zklogin_salt_${userId}`, salt);
  
  return salt;
}

/**
 * Derives Sui address from JWT token
 */
export async function deriveAddressFromJwt(jwt: string, useAltAddress = false): Promise<string> {
  try {
    // Parse JWT to get user ID
    const jwtParts = jwt.split('.');
    const payload = JSON.parse(atob(jwtParts[1]));
    const sub = payload.sub;
    
    // Extract the necessary information from JWT
    const iss = payload.iss; // Issuer
    const aud = payload.aud; // Audience (might be string or array)
    
    // Get or generate salt
    const salt = await getUserSalt(sub);
    const userSalt = BigInt(salt);
    
    // Method 1: Use jwtToAddress for direct conversion
    const address = jwtToAddress(jwt, userSalt, useAltAddress);
    
    // Method 2 (alternative): Use computeZkLoginAddress for more control
    // const addressSeed = genAddressSeed(userSalt, 'sub', sub, 
    //   typeof aud === 'string' ? aud : aud[0]
    // );
    // const address = computeZkLoginAddress({
    //   claimName: 'sub',
    //   claimValue: sub,
    //   iss,
    //   aud: typeof aud === 'string' ? aud : aud[0],
    //   userSalt,
    //   legacyAddress: useAltAddress
    // });
    
    return address;
  } catch (error) {
    console.error('Error deriving address from JWT:', error);
    throw error;
  }
}
