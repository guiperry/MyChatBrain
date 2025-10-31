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

        {/* Inline styles for initial loading indicator */}
        <style dangerouslySetInnerHTML={{ __html: `
          #initial-loader {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #1a1a1a;
            z-index: 9999;
            transition: opacity 0.3s ease;
          }
          .dark #initial-loader {
            background-color: #1a1a1a;
          }
          .light #initial-loader {
            background-color: #f5f5f5;
          }
          .loader-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
          }
          .loader-logo {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: linear-gradient(135deg, #a78bfa, #ec4899);
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 1.5rem;
            overflow: hidden;
          }
          .brain-logo {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
          .loader-title {
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 1rem;
            background: linear-gradient(to right, #a78bfa, #ec4899);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
          }
          .loader-message {
            font-size: 1.25rem;
            color: #e5e5e5;
            margin-bottom: 2rem;
          }
          .light .loader-message {
            color: #333;
          }
          .loader-bar {
            width: 300px;
            height: 6px;
            background-color: rgba(255, 255, 255, 0.1);
            border-radius: 3px;
            overflow: hidden;
          }
          .light .loader-bar {
            background-color: rgba(0, 0, 0, 0.1);
          }
          .loader-progress {
            height: 100%;
            width: 30%;
            background: linear-gradient(to right, #a78bfa, #ec4899);
            border-radius: 3px;
            animation: loading 2s infinite ease-in-out;
            transform-origin: left center;
          }
          @keyframes loading {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(100%); }
            100% { transform: translateX(300%); }
          }
        `}} />
      </head>
      <body className={`${inter.className} light`} suppressHydrationWarning={true}>
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
