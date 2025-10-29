"use client";
import React, { useEffect } from 'react';
import styles from './page.module.css';

interface ErrorProps {
  error: Error;
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className={styles.notFoundContainer || 'not-found-container'}>
      <div className={styles.notFoundContent || 'not-found-content'}>
        <h1>Something went wrong</h1>
        <p>We're sorry, but there was an error loading this page.</p>
        <button 
          onClick={reset}
          className={styles.backButton || 'back-button'}
        >
          Try again
        </button>
      </div>
    </div>
  );
}