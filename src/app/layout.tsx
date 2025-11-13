// src/app/layout.tsx
import { Inter } from "next/font/google";
import "./globals.css";
import type { Metadata } from 'next';
import React from 'react';
import ContextProvider from "@/context/ContextProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import LoadingIndicator from "@/components/LoadingIndicator"; // Import the new component

const inter = Inter({ subsets: ["latin"] });

interface RootLayoutProps {
  children: React.ReactNode
}

export const metadata: Metadata = {
  title: "My-Chat-Brain AI",
  description: "Persistent memory for your favorite AI Chat Bots",
}

const RootLayout: React.FC<RootLayoutProps> = ({ children }) => {
  return (
    <html lang="en">
      <head>
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={`${inter.className} light`}>
        {/* Initial loading indicator that shows before JS loads */}
        <LoadingIndicator /> {/* Use the new component here */}

        <ContextProvider>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </ContextProvider>
      </body>
    </html>
  );
};

export default RootLayout;
