'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import LoginButton from '@/components/auth/LoginButton';
import { FiLock, FiShield, FiUserCheck } from 'react-icons/fi';
import CustomConnectButton from '@/components/common/CustomConnectButton';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [authInProgress, setAuthInProgress] = useState(false);
  
  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);
  
  const handleAuthStart = () => {
    setAuthInProgress(true);
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
            SuiAuth
          </h1>
          <p className="text-gray-600">
            Secure authentication and identity management on Sui blockchain
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Sign in to your account</h2>
          
          {authInProgress ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Preparing authentication...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <LoginButton 
                onComplete={handleAuthStart}
                showProviders={false}
                fullWidth={true}
              />
              
              <div className="mt-8 space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-blue-100 rounded-md p-2">
                    <FiShield className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900">Secure Identity</h3>
                    <p className="text-xs text-gray-500">
                      Your identity is secured by zkLogin and the Sui blockchain
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-blue-100 rounded-md p-2">
                    <FiUserCheck className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900">Credential Management</h3>
                    <p className="text-xs text-gray-500">
                      Store and manage verifiable credentials securely
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-blue-100 rounded-md p-2">
                    <FiLock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900">Permission Control</h3>
                    <p className="text-xs text-gray-500">
                      Fine-grained control over app permissions and data access
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <p className="text-center text-xs text-gray-500 mt-4">
          By signing in, you agree to the{' '}
          <a href="#" className="text-blue-600 hover:underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="text-blue-600 hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}
