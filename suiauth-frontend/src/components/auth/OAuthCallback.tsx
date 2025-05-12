'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { parseJwtFromUrl } from '@/lib/zklogin';

interface OAuthCallbackProps {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

/**
 * Component that handles OAuth callback and completes authentication
 */
export const OAuthCallback: React.FC<OAuthCallbackProps> = ({
  onSuccess,
  onError
}) => {
  const router = useRouter();
  const { handleAuthCallback, registerIdentity, checkIdentityExists, navigateToDashboard } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const processAuth = async () => {
      try {
        // Extract JWT from URL
        const jwt = parseJwtFromUrl();
        
        if (!jwt) {
          throw new Error('No JWT token found in URL');
        }
        
        // Handle the authentication callback
        const userData = await handleAuthCallback(jwt);
        
        // Check if the user already has a SuiAuth identity
        const hasIdentity = await checkIdentityExists(userData.address);
        
        if (!hasIdentity) {
          // Parse JWT to get user info
          const jwtParts = jwt.split('.');
          const payload = JSON.parse(atob(jwtParts[1]));
          
          // Register a new identity
          await registerIdentity(
            userData.address,
            jwt,
            payload.name || 'Unnamed User',
            payload.picture || '',
            'google'
          );
        }
        
        setStatus('success');
        onSuccess?.(userData);
        
        // Redirect to dashboard
        setTimeout(() => {
          navigateToDashboard();
        }, 1500);
      } catch (err) {
        console.error('Error processing authentication:', err);
        setStatus('error');
        const error = err instanceof Error ? err : new Error('Unknown authentication error');
        setError(error);
        onError?.(error);
      }
    };
    
    processAuth();
  }, [handleAuthCallback, registerIdentity, checkIdentityExists, navigateToDashboard, onSuccess, onError]);
  
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Completing Authentication</h2>
          <p className="text-gray-600">Please wait while we securely log you in...</p>
        </div>
      </div>
    );
  }
  
  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">Authentication Failed</h2>
          <p className="text-gray-600 mb-4">{error?.message || 'An error occurred during authentication'}</p>
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-md">
        <div className="text-green-500 text-5xl mb-4">✓</div>
        <h2 className="text-xl font-semibold mb-2">Authentication Successful</h2>
        <p className="text-gray-600 mb-4">You are being redirected...</p>
      </div>
    </div>
  );
};

export default OAuthCallback;
