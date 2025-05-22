'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook } from 'react-icons/fa';
import { ConnectButton } from '@mysten/dapp-kit';
import { Button } from '@/components/UI/Button';
import CustomConnectButton from '@/components/common/CustomConnectButton';

export type Provider = 'google' | 'facebook' | 'wallet';

export interface LoginButtonProps {
  onComplete?: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  fullWidth?: boolean;
  showProviders?: boolean;
  className?: string;
}

/**
 * Component that handles login with different providers
 */
export const LoginButton: React.FC<LoginButtonProps> = ({
  onComplete,
  variant = 'default',
  size = 'default',
  fullWidth = false,
  showProviders = true,
  className,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeProvider, setActiveProvider] = useState<Provider | null>(null);
  const { login } = useAuth();
  
  /**
   * Handle login with specified provider
   */
  const handleLogin = useCallback(async (provider: Provider) => {
    try {
      setIsLoading(true);
      setActiveProvider(provider);
      
      if (provider === 'wallet') {
        // Let the ConnectButton handle wallet connection
        return;
      }
      
      // For OAuth providers, prepare zkLogin
      await login(provider);
      
      // Call the onComplete callback
      onComplete?.();
    } catch (error) {
      console.error(`Error logging in with ${provider}:`, error);
    } finally {
      setIsLoading(false);
      setActiveProvider(null);
    }
  }, [login, onComplete]);
  
  // If only showing one button with all providers
  if (!showProviders) {
    return (
      <div className="space-y-4">
        {/* Custom styling for ConnectButton */}
        <div className={`mb-3 ${fullWidth ? 'w-full' : ''}`}>
          <CustomConnectButton 
            variant="primary" 
            size="lg" 
            className="mt-4" 
            label="Connect with Sui Wallet"
          />
        </div>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">or continue with</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <Button
            onClick={() => handleLogin('google')}
            disabled={isLoading}
            variant="google"
            size={size}
            fullWidth={true}
            isLoading={isLoading && activeProvider === 'google'}
            leftIcon={<FcGoogle className="w-5 h-5" />}
          >
            Google
          </Button>
          <Button
            onClick={() => handleLogin('facebook')}
            disabled={isLoading}
            variant="facebook"
            size={size}
            fullWidth={true}
            isLoading={isLoading && activeProvider === 'facebook'}
            leftIcon={<FaFacebook className="w-5 h-5" />}
          >
            Facebook
          </Button>
        </div>
      </div>
    );
  }
  
  // Show separate buttons for each provider
  return (
    <div className="space-y-3">
      {/* Custom styling for ConnectButton */}
      <div className={`${fullWidth ? 'w-full' : ''}`}>
        <CustomConnectButton 
          variant="primary" 
          size="lg" 
          className="mt-4" 
          label="Connect with Sui Wallet"
        />
      </div>
      <Button
        onClick={() => handleLogin('google')}
        disabled={isLoading}
        variant="google"
        size={size}
        fullWidth={fullWidth}
        isLoading={isLoading && activeProvider === 'google'}
        leftIcon={<FcGoogle className="w-5 h-5" />}
        className={className}
      >
        Sign in with Google
      </Button>
      <Button
        onClick={() => handleLogin('facebook')}
        disabled={isLoading}
        variant="facebook"
        size={size}
        fullWidth={fullWidth}
        isLoading={isLoading && activeProvider === 'facebook'}
        leftIcon={<FaFacebook className="w-5 h-5" />}
        className={className}
      >
        Sign in with Facebook
      </Button>
    </div>
  );
};

export default LoginButton;
