'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useCurrentAccount, useCurrentWallet, useSuiClient } from '@mysten/dapp-kit';
import {
  clearZkLoginSession,
  deriveAddressFromJwt,
  getOAuthProvider,
  getZkLoginSession,
  parseJwtFromUrl,
  prepareZkLoginAuth,
  storeZkLoginSession,
} from '@/lib/zklogin';
import { getUserIdentity, getUserPermissions, UserIdentityResponse, PermissionResponse } from '@/lib/api';
import { getLocalStorage, removeLocalStorage, setLocalStorage } from '@/lib/storage';

export interface AuthUser {
  address: string;
  name?: string;
  email?: string;
  picture?: string;
  provider: string;
  jwt?: string;
  identityId?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  currentUser: AuthUser | null;
  identity: UserIdentityResponse | null;
  permissions: PermissionResponse[];
  login: (provider: string, redirectUrl?: string) => Promise<void>;
  logout: () => void;
  error: Error | null;
  handleAuthCallback: (jwt: string) => Promise<{ address: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [identity, setIdentity] = useState<UserIdentityResponse | null>(null);
  const [permissions, setPermissions] = useState<PermissionResponse[]>([]);
  const [error, setError] = useState<Error | null>(null);
  
  const account = useCurrentAccount();
  const wallet = useCurrentWallet();
  const suiClient = useSuiClient();
  
  // Check authentication status on load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        
        // Check for stored JWT and address
        const jwt = getLocalStorage('suiauth_jwt');
        const storedAddress = getLocalStorage('suiauth_address');
        
        if (jwt && storedAddress) {
          // Verify JWT is still valid (in a real app you'd verify expiration, etc.)
          
          // Parse JWT to get user info
          const jwtParts = jwt.split('.');
          if (jwtParts.length !== 3) {
            throw new Error('Invalid JWT format');
          }
          
          const payload = JSON.parse(atob(jwtParts[1]));
          const name = payload.name || 'Unnamed User';
          const email = payload.email || '';
          const picture = payload.picture || '';
          
          setCurrentUser({
            address: storedAddress,
            name,
            email,
            picture,
            provider: 'google', // This would come from the token in a real app
            jwt
          });
          
          // Fetch user identity and permissions
          if (storedAddress) {
            const userIdentity = await getUserIdentity(storedAddress);
            const userPermissions = await getUserPermissions(storedAddress);
            
            if (userIdentity) {
              setIdentity(userIdentity);
              setPermissions(userPermissions);
            }
          }
          
          setIsAuthenticated(true);
        } else if (account) {
          // User has wallet connected but not zkLogin
          setCurrentUser({
            address: account.address,
            provider: 'wallet',
          });
          
          // Fetch user identity and permissions for wallet user
          const userIdentity = await getUserIdentity(account.address);
          const userPermissions = await getUserPermissions(account.address);
          
          if (userIdentity) {
            setIdentity(userIdentity);
            setPermissions(userPermissions);
          }
          
          setIsAuthenticated(true);
        } else {
          setCurrentUser(null);
          setIdentity(null);
          setPermissions([]);
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('Authentication initialization error:', err);
        setError(err instanceof Error ? err : new Error('Unknown authentication error'));
        
        // Clear potentially corrupt auth data
        removeLocalStorage('suiauth_jwt');
        removeLocalStorage('suiauth_address');
        
        setCurrentUser(null);
        setIdentity(null);
        setPermissions([]);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [account, suiClient]);
  
  /**
   * Initiates login flow with specified provider
   */
  const login = async (providerName: string, redirectUrl?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const provider = getOAuthProvider(providerName);
      if (!provider) {
        throw new Error(`Unsupported provider: ${providerName}`);
      }
      
      // Get the latest epoch from the network for zkLogin
      const { epoch } = await suiClient.getLatestSuiSystemState();
      const maxEpoch = Number(epoch) + 10; // Add buffer for expiration
      
      // Prepare zkLogin auth flow
      const callbackUrl = redirectUrl || `${window.location.origin}/auth/callback`;
      const { url, nonce, keypair } = await prepareZkLoginAuth(
        provider,
        callbackUrl,
        maxEpoch
      );
      
      // Store session data
      storeZkLoginSession(keypair, maxEpoch, nonce);
      
      // Redirect to auth URL
      window.location.href = url;
    } catch (err) {
      console.error('Error during login:', err);
      setError(err instanceof Error ? err : new Error('Unknown login error'));
      setIsLoading(false);
    }
  };
  
  /**
   * Handles OAuth callback and JWT processing
   */
  const handleAuthCallback = async (jwt: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get session data
      const { keypair, maxEpoch, nonce } = getZkLoginSession();
      
      if (!keypair || !maxEpoch || !nonce) {
        throw new Error('Missing authentication data');
      }
      
      // Derive address from JWT - checking both legacy and current address formats
      // First try with regular address format
      let userAddress = await deriveAddressFromJwt(jwt, false);
      
      // For existing accounts, we should check if they might be using the legacy format
      // This would typically involve checking both addresses against on-chain data
      // to see which one has activity
      const legacyAddress = await deriveAddressFromJwt(jwt, true);
      
      console.log('Derived addresses:', {
        standard: userAddress,
        legacy: legacyAddress
      });
      
      // In a real implementation, this would generate and verify a zkLogin proof
      // For this simplified example, we'll skip that step and use the standard address
      
      // Parse JWT to get user info
      const jwtParts = jwt.split('.');
      const payload = JSON.parse(atob(jwtParts[1]));
      const name = payload.name || 'Unnamed User';
      const email = payload.email || '';
      const picture = payload.picture || '';
      
      // Store user data
      setLocalStorage('suiauth_jwt', jwt);
      setLocalStorage('suiauth_address', userAddress);
      
      // Fetch user identity and permissions
      const userIdentity = await getUserIdentity(userAddress);
      const userPermissions = await getUserPermissions(userAddress);
      
      // Update state
      setCurrentUser({
        address: userAddress,
        name,
        email,
        picture,
        provider: 'google', // This would come from the token in a real app
        jwt,
        identityId: userIdentity?.address,
      });
      
      if (userIdentity) {
        setIdentity(userIdentity);
        setPermissions(userPermissions);
      }
      
      setIsAuthenticated(true);
      
      return { address: userAddress };
    } catch (err) {
      console.error('Error handling auth callback:', err);
      setError(err instanceof Error ? err : new Error('Unknown authentication error'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Logs out the user
   */
  const logout = () => {
    try {
      // Clear auth data
      clearZkLoginSession();
      removeLocalStorage('suiauth_jwt');
      removeLocalStorage('suiauth_address');
      
      // Reset state
      setCurrentUser(null);
      setIdentity(null);
      setPermissions([]);
      setIsAuthenticated(false);
      setError(null);
    } catch (err) {
      console.error('Error during logout:', err);
      setError(err instanceof Error ? err : new Error('Unknown logout error'));
    }
  };
  
  // Create context value
  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    currentUser,
    identity,
    permissions,
    login,
    logout,
    error,
    handleAuthCallback,
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use authentication functionality
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
