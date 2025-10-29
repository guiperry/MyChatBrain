"use client";

import React, { useEffect, useState } from 'react';
import styles from './LoadingFallback.module.css';

interface LoadingFallbackProps {
  message?: string;
}

/**
 * Fallback component shown when the application is loading
 */
const LoadingFallback: React.FC<LoadingFallbackProps> = ({
  message = "Loading application..."
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simple animation for the loading bar
    const interval = setInterval(() => {
      setProgress(prev => {
        // Gradually increase progress but never reach 100%
        if (prev < 90) {
          return prev + (90 - prev) * 0.1;
        }
        return prev;
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.fallbackContainer}>
      <div className={styles.content}>
        <div className={styles.logoContainer}>
          <div className={styles.logo}>C-C</div>
        </div>
        <h1 className={styles.title}>My-Chat-Brain AI</h1>
        <p className={styles.message}>{message}</p>
        <div className={styles.loadingBar}>
          <div
            className={styles.loadingProgress}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default LoadingFallback;