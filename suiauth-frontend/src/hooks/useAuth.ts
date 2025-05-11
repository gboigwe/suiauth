'use client';

import { useCallback } from 'react';
import { useAuth as useAuthContext } from '@/providers/auth-provider';
import { useRouter } from 'next/navigation';
import { useSuiClient } from '@mysten/dapp-kit'; // Import directly from dapp-kit
import { suiAuthContract } from '@/config/contracts';

/**
 * Extended authentication hook with additional functionality
 */
export function useAuth() {
  const auth = useAuthContext();
  const router = useRouter();
  const suiClient = useSuiClient();
  
  /**
   * Navigate to login page
   */
  const navigateToLogin = useCallback(() => {
    router.push('/login');
  }, [router]);
  
  /**
   * Navigate to dashboard
   */
  const navigateToDashboard = useCallback(() => {
    router.push('/dashboard');
  }, [router]);
  
  /**
   * Handles authentication result
   */
  const handleAuthSuccess = useCallback(() => {
    navigateToDashboard();
  }, [navigateToDashboard]);
  
  /**
   * Logs out and redirects to login page
   */
  const logoutAndRedirect = useCallback(() => {
    auth.logout();
    navigateToLogin();
  }, [auth, navigateToLogin]);
  
  /**
   * Check if identity exists on-chain
   */
  const checkIdentityExists = useCallback(async (address: string): Promise<boolean> => {
    try {
      if (!address) return false;
      
      // In a real implementation, this would check for identity objects owned by the address
      // For this example, we'll use a simplified approach
      const identity = auth.identity;
      
      return !!identity;
    } catch (error) {
      console.error('Error checking identity existence:', error);
      return false;
    }
  }, [auth.identity]);
  
  /**
   * Register a new identity
   */
  const registerIdentity = useCallback(async (
    address: string,
    jwt: string,
    name: string,
    avatarUri: string = '',
    provider: string = 'google'
  ) => {
    try {
      if (!address) {
        throw new Error('Address is required');
      }
      
      // Parse JWT to get user info for the sub field
      const jwtParts = jwt.split('.');
      const payload = JSON.parse(atob(jwtParts[1]));
      const sub = payload.sub; // Subject identifier
      
      // In a real implementation, we would use the Transaction class from @mysten/sui
      // to build and submit a transaction to register the identity
      console.log('Would register identity with:', {
        address,
        name,
        provider,
        sub,
      });
      
      // Return a mock result for demo purposes
      return {
        digest: '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')
      };
    } catch (error) {
      console.error('Error registering identity:', error);
      throw error;
    }
  }, []);
  
  return {
    ...auth,
    navigateToLogin,
    navigateToDashboard,
    handleAuthSuccess,
    logoutAndRedirect,
    checkIdentityExists,
    registerIdentity,
  };
}

export default useAuth;
