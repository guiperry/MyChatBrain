"use client";

import React, { useEffect } from 'react';
import { setupErrorHandling } from '@/lib/errorHandling';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

/**
 * Client-side error boundary component that sets up automatic reload
 * for ChunkLoadError scenarios
 */
const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({ children }) => {
  // Set up error handling with automatic reload
  useEffect(() => {
    const cleanup = setupErrorHandling();
    return cleanup;
  }, []);

  return <>{children}</>;
};

export default ErrorBoundary;