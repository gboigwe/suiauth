'use client';

import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import classNames from 'classnames';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'wallet' | 'google' | 'facebook' | 'loading';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  fullWidth?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/**
 * Button component with multiple variants and sizes
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      fullWidth = false,
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    // Define button styles based on variants
    const getVariantClasses = () => {
      switch (variant) {
        case 'default':
          return 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500';
        case 'destructive':
          return 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500';
        case 'outline':
          return 'border border-gray-300 bg-transparent hover:bg-gray-50 text-gray-700 focus-visible:ring-blue-500';
        case 'secondary':
          return 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-500';
        case 'ghost':
          return 'bg-transparent hover:bg-gray-100 text-gray-700 focus-visible:ring-blue-500';
        case 'link':
          return 'bg-transparent text-blue-600 hover:underline focus-visible:ring-blue-500 p-0 h-auto';
        case 'wallet':
          return 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500';
        case 'google':
          return 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50 focus-visible:ring-blue-500';
        case 'facebook':
          return 'bg-[#1877F2] text-white hover:bg-[#166FE5] focus-visible:ring-blue-500';
        case 'loading':
          return 'bg-gray-100 text-gray-500 cursor-not-allowed';
        default:
          return 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500';
      }
    };

    // Define button sizes
    const getSizeClasses = () => {
      switch (size) {
        case 'default':
          return 'h-10 py-2 px-4';
        case 'sm':
          return 'h-9 px-3 rounded-md';
        case 'lg':
          return 'h-12 px-6 rounded-lg text-base';
        case 'icon':
          return 'h-10 w-10';
        default:
          return 'h-10 py-2 px-4';
      }
    };

    // Determine the actual variant to use
    const buttonVariant = isLoading ? 'loading' : variant;
    
    return (
      <button
        className={classNames(
          'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
          getVariantClasses(),
          getSizeClasses(),
          fullWidth ? 'w-full' : '',
          className
        )}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        {!isLoading && leftIcon && (
          <span className="mr-2">{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && (
          <span className="ml-2">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
export default Button;
