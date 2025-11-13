// src/components/LoadingIndicator.tsx
"use client";
import React, { useEffect, useState } from 'react';

// Brain SVG icon as a component
const BrainIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="white" className="brain-logo">
    <path d="M184 0c30.9 0 56 25.1 56 56V456c0 30.9-25.1 56-56 56c-28.9 0-52.6-21.9-55.7-50.1c-5.2 1.4-10.7 2.1-16.3 2.1c-35.3 0-64-28.7-64-64c0-7.4 1.3-14.6 3.6-21.2C21.4 367.4 0 338.2 0 304c0-31.9 18.7-59.5 45.8-72.3C37.1 220.8 32 207 32 192c0-30.7 21.6-56.3 50.4-62.6C80.8 123.9 80 118 80 112c0-29.9 20.6-55.1 48.3-62.1C131.3 21.9 155.1 0 184 0zM328 0c28.9 0 52.6 21.9 55.7 50.1c5.2-1.4 10.7-2.1 16.3-2.1c35.3 0 64 28.7 64 64c0 7.4-1.3 14.6-3.6 21.2C490.6 144.6 512 173.8 512 208c0 31.9-18.7 59.5-45.8 72.3C474.9 291.2 480 305 480 320c0 30.7-21.6 56.3-50.4 62.6c1.6 5.4 2.4 11.3 2.4 17.4c0 29.9-20.6 55.1-48.3 62.1C380.7 490.1 356.9 512 328 512c-30.9 0-56-25.1-56-56V56c0-30.9 25.1-56 56-56zM184 80c-8.8 0-16 7.2-16 16s7.2 16 16 16H328c8.8 0 16-7.2 16-16s-7.2-16-16-16H184zm0 64c-8.8 0-16 7.2-16 16s7.2 16 16 16H328c8.8 0 16-7.2 16-16s-7.2-16-16-16H184zm0 64c-8.8 0-16 7.2-16 16s7.2 16 16 16H328c8.8 0 16-7.2 16-16s-7.2-16-16-16H184zm0 64c-8.8 0-16 7.2-16 16s7.2 16 16 16H328c8.8 0 16-7.2 16-16s-7.2-16-16-16H184zm0 64c-8.8 0-16 7.2-16 16s7.2 16 16 16H328c8.8 0 16-7.2 16-16s-7.2-16-16-16H184zm0 64c-8.8 0-16 7.2-16 16s7.2 16 16 16H328c8.8 0 16-7.2 16-16s-7.2-16-16-16H184z"/>
  </svg>
);

const LoadingIndicator: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const hideLoader = () => {
      setIsLoading(false);
    };

    // Listen for app ready event
    const handleAppReady = () => {
      console.log('App ready event received, hiding loader');
      hideLoader();
    };

    if (document.readyState === 'complete') {
      hideLoader();
    } else {
      window.addEventListener('load', hideLoader);
    }

    // Listen for custom app-ready event
    window.addEventListener('app-ready', handleAppReady);

    const timeoutId = setTimeout(hideLoader, 3000);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('load', hideLoader);
      window.removeEventListener('app-ready', handleAppReady);
    };
  }, []);

  if (!isLoading) return null;

  return (
    <div id="initial-loader">
      <div className="loader-content">
        <div className="loader-logo">
          <BrainIcon />
        </div>
        <h1 className="loader-title">My-Chat-Brain AI</h1>
        <p className="loader-message">Loading application...</p>
        <div className="loader-bar">
          <div className="loader-progress"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingIndicator;
