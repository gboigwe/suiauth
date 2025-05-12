'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { FiUser, FiKey, FiShield, FiLock, FiLogOut } from 'react-icons/fi';

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, currentUser, logout, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('identity');
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);
  
  // Handle logout
  const handleLogout = () => {
    logout();
    router.push('/login');
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Loading</h2>
          <p className="text-gray-600">Please wait...</p>
        </div>
      </div>
    );
  }
  
  if (!currentUser) {
    return null; // Will redirect via the useEffect
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">SuiAuth</h1>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {currentUser.name || 'Unnamed User'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {currentUser.address.slice(0, 6)}...{currentUser.address.slice(-4)}
              </p>
            </div>
            
            <button
              onClick={handleLogout}
              className="p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <FiLogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Tabs */}
          <div className="bg-gray-100 border-b border-gray-200">
            <div className="flex">
              <button
                className={`py-4 px-6 text-sm font-medium flex items-center focus:outline-none ${
                  activeTab === 'identity' 
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab('identity')}
              >
                <FiUser className="mr-2" />
                Identity
              </button>
              <button
                className={`py-4 px-6 text-sm font-medium flex items-center focus:outline-none ${
                  activeTab === 'permissions' 
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab('permissions')}
              >
                <FiShield className="mr-2" />
                Permissions
              </button>
              <button
                className={`py-4 px-6 text-sm font-medium flex items-center focus:outline-none ${
                  activeTab === 'credentials' 
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab('credentials')}
              >
                <FiKey className="mr-2" />
                Credentials
              </button>
              <button
                className={`py-4 px-6 text-sm font-medium flex items-center focus:outline-none ${
                  activeTab === 'recovery' 
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab('recovery')}
              >
                <FiLock className="mr-2" />
                Recovery
              </button>
            </div>
          </div>
          
          {/* Tab content */}
          <div className="p-6">
            {activeTab === 'identity' && (
              <div className="max-w-2xl mx-auto">
                <h2 className="text-xl font-semibold mb-6">Your Identity</h2>
                
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                  <div className="p-6">
                    <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                      <div>
                        <h3 className="text-lg font-medium">
                          {currentUser.name || 'Unnamed User'}
                        </h3>
                        <p className="text-gray-500 text-sm mt-1">
                          {currentUser.provider === 'google' ? 'Google Account' : 'Wallet Account'}
                        </p>
                      </div>
                      
                      <div className="flex-shrink-0">
                        {currentUser.picture ? (
                          <img 
                            src={currentUser.picture} 
                            alt={currentUser.name || 'User'}
                            className="h-14 w-14 rounded-full"
                          />
                        ) : (
                          <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center">
                            <FiUser className="h-6 w-6 text-blue-600" />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="py-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Address</span>
                        <span className="font-mono text-sm">
                          {currentUser.address}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-500">Identity ID</span>
                        <span className="font-mono text-sm">
                          {currentUser.identityId || 'Not registered'}
                        </span>
                      </div>
                      
                      {currentUser.email && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Email</span>
                          <span>{currentUser.email}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between">
                        <span className="text-gray-500">Authentication</span>
                        <span className="flex items-center text-green-600">
                          <svg className="w-4 h-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Active
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'permissions' && (
              <div className="max-w-3xl mx-auto">
                <h2 className="text-xl font-semibold mb-6">Application Permissions</h2>
                <p className="text-gray-600 mb-6">
                  These applications have permission to access your identity. You can revoke access at any time.
                </p>
                
                <div className="space-y-4">
                  {/* Sample permission items - these would be dynamically loaded */}
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                          <span className="text-gray-500 font-bold">E</span>
                        </div>
                        <div>
                          <h3 className="font-medium">Example dApp</h3>
                          <p className="text-sm text-gray-500">
                            <a
                              href="https://example.com"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline"
                            >
                              example.com
                            </a>
                          </p>
                        </div>
                      </div>
                      <button className="px-3 py-1 rounded-md text-sm bg-red-100 text-red-600 hover:bg-red-200">
                        Revoke
                      </button>
                    </div>
                    
                    <div className="mt-3 border-t border-gray-200 pt-3">
                      <div className="text-sm">
                        <div className="flex items-center mb-1">
                          <span className="text-gray-500 w-24">Scopes:</span>
                          <div className="flex flex-wrap gap-1">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              profile:read
                            </span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              transactions:write
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center mb-1">
                          <span className="text-gray-500 w-24">Granted:</span>
                          <span>May 5, 2023</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-gray-500 w-24">Status:</span>
                          <span className="text-green-600 flex items-center">
                            <svg className="w-4 h-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Active
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                          <span className="text-gray-500 font-bold">D</span>
                        </div>
                        <div>
                          <h3 className="font-medium">Demo Application</h3>
                          <p className="text-sm text-gray-500">
                            <a
                              href="https://demo.example.com"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline"
                            >
                              demo.example.com
                            </a>
                          </p>
                        </div>
                      </div>
                      <button className="px-3 py-1 rounded-md text-sm bg-red-100 text-red-600 hover:bg-red-200">
                        Revoke
                      </button>
                    </div>
                    
                    <div className="mt-3 border-t border-gray-200 pt-3">
                      <div className="text-sm">
                        <div className="flex items-center mb-1">
                          <span className="text-gray-500 w-24">Scopes:</span>
                          <div className="flex flex-wrap gap-1">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              profile:read
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center mb-1">
                          <span className="text-gray-500 w-24">Granted:</span>
                          <span>May 7, 2023</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-gray-500 w-24">Status:</span>
                          <span className="text-green-600 flex items-center">
                            <svg className="w-4 h-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Active
                          </span>
                        </div>
                        <div className="flex items-center mt-1">
                          <span className="text-gray-500 w-24">Expires:</span>
                          <span>June 7, 2023</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'credentials' && (
              <div className="max-w-3xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Your Credentials</h2>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    Add Credential
                  </button>
                </div>
                
                <div className="space-y-4">
                  {/* Sample credentials - these would be loaded dynamically */}
                  <div className="border rounded-lg overflow-hidden border-gray-200">
                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">
                            KYC Verification
                          </h3>
                          <p className="text-gray-600">Issued by Verisure Identity</p>
                        </div>
                        <div className="flex items-center px-2 py-1 rounded-full bg-green-100 text-green-600">
                          <svg className="w-4 h-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm font-medium">Valid</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 space-y-2 text-sm">
                        <div className="flex">
                          <span className="text-gray-500 w-24">Issued:</span>
                          <span>April 8, 2023</span>
                        </div>
                        
                        <div className="flex">
                          <span className="text-gray-500 w-24">Expires:</span>
                          <span>April 8, 2024</span>
                        </div>
                        
                        <div className="flex">
                          <span className="text-gray-500 w-24">Metadata:</span>
                          <span>Level 2</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                      <div className="flex items-center text-gray-500 text-sm">
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <span>Credential ID: 0x1234...</span>
                      </div>
                      
                      <button className="text-sm text-red-600 hover:text-red-800">
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg overflow-hidden border-gray-200">
                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">
                            Email Verification
                          </h3>
                          <p className="text-gray-600">Issued by SuiAuth</p>
                        </div>
                        <div className="flex items-center px-2 py-1 rounded-full bg-green-100 text-green-600">
                          <svg className="w-4 h-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm font-medium">Valid</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 space-y-2 text-sm">
                        <div className="flex">
                          <span className="text-gray-500 w-24">Issued:</span>
                          <span>May 3, 2023</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                      <div className="flex items-center text-gray-500 text-sm">
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <span>Credential ID: 0x5678...</span>
                      </div>
                      
                      <button className="text-sm text-red-600 hover:text-red-800">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'recovery' && (
              <div className="max-w-3xl mx-auto">
                <h2 className="text-xl font-semibold mb-2">Identity Recovery</h2>
                <p className="text-gray-600 mb-6">
                  Configure recovery options to ensure you never lose access to your identity.
                </p>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-4">Recovery Configuration</h3>
                  
                  <div className="space-y-6">
                    {/* Guardians Section */}
                    <div>
                      <h4 className="text-base font-medium mb-2">Guardians</h4>
                      <p className="text-gray-600 text-sm mb-4">
                        Guardians are trusted addresses that can help you recover your identity.
                      </p>
                      
                      <div className="p-4 bg-gray-50 border border-gray-200 rounded text-gray-500 text-center">
                        No guardians added yet
                      </div>
                      
                      <div className="mt-4">
                        <div className="bg-gray-50 border border-gray-200 rounded p-3">
                          <div className="flex mb-2">
                            <input
                              type="text"
                              placeholder="Guardian address (0x...)"
                              className="flex-1 p-2 border border-gray-300 rounded-l focus:ring-blue-500 focus:border-blue-500"
                            />
                            <button
                              type="button"
                              className="bg-blue-600 text-white px-4 rounded-r hover:bg-blue-700"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            </button>
                          </div>
                          <input
                            type="text"
                            placeholder="Label (optional)"
                            className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Threshold Section */}
                    <div>
                      <h4 className="text-base font-medium mb-2">Threshold</h4>
                      <p className="text-gray-600 text-sm mb-4">
                        Number of guardians required to approve a recovery request.
                      </p>
                      
                      <div className="flex items-center">
                        <input
                          type="range"
                          min="1"
                          max="1"
                          value="1"
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          disabled
                        />
                        <span className="ml-4 min-w-8 text-center">
                          1 of 0
                        </span>
                      </div>
                    </div>
                    
                    {/* Timelock Section */}
                    <div>
                      <h4 className="text-base font-medium mb-2">Time Delay</h4>
                      <p className="text-gray-600 text-sm mb-4">
                        Waiting period (in epochs ≈ hours) before a recovery can be completed.
                      </p>
                      
                      <div className="flex items-center">
                        <input
                          type="range"
                          min="1"
                          max="72"
                          value="24"
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="ml-4 min-w-8 text-center">
                          24 epochs
                        </span>
                      </div>
                    </div>
                    
                    {/* Emergency Address Section */}
                    <div>
                      <h4 className="text-base font-medium mb-2">Emergency Recovery</h4>
                      <p className="text-gray-600 text-sm mb-4">
                        Optional backup address that can recover your identity without guardian approval.
                      </p>
                      
                      <input
                        type="text"
                        placeholder="Emergency address (0x...)"
                        className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div className="pt-4 border-t border-gray-200">
                      <button
                        type="button"
                        className="w-full py-2 px-4 rounded font-medium bg-gray-300 text-gray-500 cursor-not-allowed"
                      >
                        Save Recovery Configuration
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
