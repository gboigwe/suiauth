'use client';

import { Inter as FontSans } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { SuiProvider } from '@/providers/sui-provider';
import { AuthProvider } from '@/providers/auth-provider';

// Remove preload since we're using `use client`
const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <title>SuiAuth - Decentralized Identity Platform</title>
        <meta name="description" content="Secure authentication and identity management on Sui blockchain" />
        <Script
          src="https://cdn.tailwindcss.com"
          strategy="beforeInteractive"
        />
      </head>
      <body className={`${fontSans.variable} font-sans min-h-screen bg-gray-50`}>
        <SuiProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </SuiProvider>
      </body>
    </html>
  );
}
