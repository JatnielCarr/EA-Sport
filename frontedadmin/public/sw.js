// =====================================================
// SERVICE WORKER - Offline Support & Static Caching
// =====================================================

const CACHE_NAME = 'ea-sports-v1.0.1';
const STATIC_CACHE = 'ea-sports-static-v1.0.1';
const DYNAMIC_CACHE = 'ea-sports-dynamic-v1.0.1';

// Check if we're in development mode
const isDev = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';

// Files to cache immediately (only in production)
const STATIC_ASSETS = [
  '/',
  '/index.html',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  // In development, skip caching to avoid stale files
  if (isDev) {
    console.log('[Service Worker] Development mode - minimal caching');
    self.skipWaiting();
    return;
  }
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch(err => {
        console.warn('[Service Worker] Cache failed:', err);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // In development mode, always use network first
  if (isDev) {
    return; // Let the browser handle it normally
  }

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Skip API requests (handled by cache.js)
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Network first, cache fallback strategy for production
  event.respondWith(
    fetch(request)
      .then(response => {
        // Only cache successful responses
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        // Clone response (can only be consumed once)
        const responseToCache = response.clone();

        caches.open(DYNAMIC_CACHE)
          .then(cache => {
            cache.put(request, responseToCache);
          });

        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(request)
          .then(cachedResponse => {
            if (cachedResponse) {
              console.log('[Service Worker] Serving from cache (offline):', url.pathname);
              return cachedResponse;
            }
            // Return offline page if available
            return caches.match('/index.html');
          });
      })
  );
});

// Handle messages from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      })
    );
  }
});
