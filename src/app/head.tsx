export default function Head() {
  return (
    <>
      <title>My-Chat-Brain AI</title>
      <meta content="width=device-width, initial-scale=1" name="viewport" />
      <meta name="description" content="An AI powered conversational assistant" />
      <link rel="icon" href="/favicon.ico" />

      {/* Unified initialization and error handling */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              // Track initialization state and reload attempts
              const STORAGE_KEY = 'chatchain_reload_attempts';
              const MAX_RELOAD_ATTEMPTS = 3;
              const RELOAD_ATTEMPT_RESET_TIME = 60 * 1000;
              let initialized = false;

              function initializeApp(attempt = 1) {
                if (initialized || attempt > 5) return;
                console.log('Initialization attempt', attempt);

                // Combined auth and health check
                Promise.all([
                  fetch('/api/auth/me', { credentials: 'include' }),
                  fetch('/api/health', { credentials: 'include' })
                ])
                .then(([authRes, healthRes]) => {
                  if (!authRes.ok) {
                    console.log('Auth failed - redirecting to login');
                    window.location.href = '/login';
                    return;
                  }
                  
                  if (!healthRes.ok) {
                    throw new Error('Health check failed');
                  }
                  
                  console.log('App initialized successfully');
                  initialized = true;
                  localStorage.removeItem(STORAGE_KEY);
                })
                .catch(error => {
                  console.error('Initialization error:', error);
                  setTimeout(() => initializeApp(attempt + 1), 1000);
                });
              }

              // Error handler for chunk loading
              window.addEventListener('error', function(event) {
                if (event.message && /ChunkLoadError|Loading chunk/.test(event.message)) {
                  const attempts = trackReloadAttempt();
                  if (attempts < MAX_RELOAD_ATTEMPTS) {
                    console.warn('Reloading due to chunk error');
                    setTimeout(() => window.location.reload(), 1000);
                  }
                }
              });

              // Track reload attempts
              function trackReloadAttempt() {
                try {
                  const now = Date.now();
                  const reloadData = localStorage.getItem(STORAGE_KEY);
                  let attempts = 0;
                  let timestamp = now;

                  if (reloadData) {
                    const data = JSON.parse(reloadData);
                    if (now - data.timestamp > RELOAD_ATTEMPT_RESET_TIME) {
                      attempts = 1;
                    } else {
                      attempts = data.attempts + 1;
                    }
                  } else {
                    attempts = 1;
                  }

                  localStorage.setItem(STORAGE_KEY,
                    JSON.stringify({ attempts, timestamp }));
                  return attempts;
                } catch (e) {
                  return 1;
                }
              }

              // Start initialization
              initializeApp();
            })();
          `,
        }}
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              // Track reload attempts to prevent infinite loops
              const STORAGE_KEY = 'chatchain_reload_attempts';
              const MAX_RELOAD_ATTEMPTS = 3;
              const RELOAD_ATTEMPT_RESET_TIME = 60 * 1000; // 1 minute

              function trackReloadAttempt() {
                try {
                  const now = Date.now();
                  const reloadData = localStorage.getItem(STORAGE_KEY);

                  let attempts = 0;
                  let timestamp = now;

                  if (reloadData) {
                    const data = JSON.parse(reloadData);
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
                  return 0;
                }
              }

              function shouldReload() {
                try {
                  const reloadData = localStorage.getItem(STORAGE_KEY);
                  if (!reloadData) return true;

                  const data = JSON.parse(reloadData);
                  return data.attempts < MAX_RELOAD_ATTEMPTS;
                } catch (e) {
                  return true;
                }
              }

              // Set up early error handler
              window.addEventListener('error', function(event) {
                if (
                  event &&
                  event.message &&
                  (
                    event.message.includes('ChunkLoadError') ||
                    event.message.includes('Loading chunk') ||
                    event.message.includes('Loading CSS chunk') ||
                    event.message.includes('Failed to load resource')
                  )
                ) {
                  if (shouldReload()) {
                    console.warn('Early error detection: Reloading due to chunk load error');
                    trackReloadAttempt();
                    setTimeout(function() {
                      window.location.reload();
                    }, 1000);
                  }
                }
              }, true);

              // Reset reload attempts counter on successful load
              window.addEventListener('load', function() {
                localStorage.removeItem(STORAGE_KEY);
              });
            })();
          `,
        }}
      />
    </>
  );
}