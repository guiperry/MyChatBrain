// src/app/layout.tsx
import { Inter } from "next/font/google";
import "./globals.css";
import type { Metadata } from 'next';
import React from 'react';
import ContextProvider from "@/context/ContextProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import LoadingIndicator from "@/components/LoadingIndicator";
import { ClerkProvider } from "@clerk/nextjs";

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
        <ClerkProvider>
          <LoadingIndicator />

          <ContextProvider>
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </ContextProvider>
        </ClerkProvider>
      </body>
    </html>
  );
};

export default RootLayout;
