'use client';

import React from 'react';
import { ConnectButton } from '@/providers/sui-provider';

interface CustomConnectButtonProps {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  label?: string;
}

const CustomConnectButton: React.FC<CustomConnectButtonProps> = ({
  variant = 'primary',
  size = 'default',
  className = '',
  label = 'Connect Wallet'
}) => {
  // Define styles based on variant and size
  const getVariantClass = () => {
    switch (variant) {
      case 'primary':
        return 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500';
      case 'secondary':
        return 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500';
      case 'outline':
        return 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-indigo-500';
      default:
        return 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500';
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-2 text-sm';
      case 'default':
        return 'px-4 py-2';
      case 'lg':
        return 'px-6 py-3 text-lg';
      default:
        return 'px-4 py-2';
    }
  };

  return (
    <ConnectButton
      className={`font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${getVariantClass()} ${getSizeClass()} ${className}`}
    >
      {label}
    </ConnectButton>
  );
};

export default CustomConnectButton;
