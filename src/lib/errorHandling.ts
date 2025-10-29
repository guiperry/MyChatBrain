/**
 * Utility for handling client-side errors and implementing automatic reload
 * mechanisms for ChunkLoadError.
 */

// Track reload attempts to prevent infinite reload loops
const STORAGE_KEY = 'chatchain_reload_attempts';
const MAX_RELOAD_ATTEMPTS = 3;
const RELOAD_ATTEMPT_RESET_TIME = 60 * 1000; // 1 minute

/**
 * Sets up error handling and automatic reload for the application
 */
export function setupErrorHandling(): () => void {
  // Only run on client side
  if (typeof window === 'undefined') {
    return () => {};
  }

  // Track reload attempts to prevent infinite loops
  const trackReloadAttempt = () => {
    try {
      const now = Date.now();
      const reloadData = localStorage.getItem(STORAGE_KEY);

      let attempts = 0;
      let timestamp = now;

      if (reloadData) {
        const data = JSON.parse(reloadData);
        // Reset counter if it's been more than the reset time
        if (now - data.timestamp > RELOAD_ATTEMPT_RESET_TIME) {
          attempts = 1;
          timestamp = now;
        } else {
          attempts = data.attempts + 1;
          timestamp = data.timestamp;
        }
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify({ attempts, timestamp }));
      return attempts;
    } catch (e) {
      // If localStorage fails, return a safe value
      return 0;
    }
  };

  const shouldReload = () => {
    try {
      const reloadData = localStorage.getItem(STORAGE_KEY);
      if (!reloadData) return true;

      const data = JSON.parse(reloadData);
      return data.attempts < MAX_RELOAD_ATTEMPTS;
    } catch (e) {
      return true;
    }
  };

  const performReload = (reason: string) => {
    console.warn(`Reloading page due to: ${reason}`);
    const attempts = trackReloadAttempt();

    if (attempts < MAX_RELOAD_ATTEMPTS) {
      // Add a small delay before reloading
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      console.error(`Maximum reload attempts (${MAX_RELOAD_ATTEMPTS}) reached. Please refresh manually.`);
      // Show a user-friendly message
      if (document.body) {
        const errorDiv = document.createElement('div');
        errorDiv.style.position = 'fixed';
        errorDiv.style.top = '0';
        errorDiv.style.left = '0';
        errorDiv.style.width = '100%';
        errorDiv.style.padding = '20px';
        errorDiv.style.backgroundColor = '#f87171';
        errorDiv.style.color = 'white';
        errorDiv.style.textAlign = 'center';
        errorDiv.style.zIndex = '9999';
        errorDiv.innerHTML = `
          <p>We're having trouble loading the application. Please try refreshing the page manually.</p>
          <button onclick="window.location.reload()" style="background-color: white; color: #f87171; border: none; padding: 8px 16px; margin-top: 10px; border-radius: 4px; cursor: pointer;">
            Refresh Now
          </button>
        `;
        document.body.prepend(errorDiv);
      }
    }
  };

  // Set up error handler for ChunkLoadError
  const originalOnError = window.onerror;
  window.onerror = function(message, source, lineno, colno, error) {
    // Check if it's a ChunkLoadError or other loading-related error
    if (
      message &&
      (
        message.toString().includes('ChunkLoadError') ||
        message.toString().includes('Loading chunk') ||
        message.toString().includes('Loading CSS chunk') ||
        message.toString().includes('Failed to load resource')
      )
    ) {
      if (shouldReload()) {
        performReload('ChunkLoadError');
      }
      return true; // Prevent the error from being logged to the console
    }

    // Call the original handler if it exists
    if (typeof originalOnError === 'function') {
      return originalOnError(message, source, lineno, colno, error);
    }
    return false;
  };

  // Reset reload attempts counter on successful load
  window.addEventListener('load', () => {
    localStorage.removeItem(STORAGE_KEY);
  });

  // Return cleanup function
  return () => {
    window.onerror = originalOnError;
  };
}