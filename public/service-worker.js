/* eslint-disable no-restricted-globals */

/**
 * Advanced Caching Strategy for EdenDrop001
 * - Cache busting with daily version updates
 * - Separate caches for static, dynamic, and API resources
 * - Intelligent fallback strategies for offline
 */

// Version-based cache names (updates automatically)
const getCacheVersion = () => {
  try {
    const swUrl = new URL(self.location.href);
    const versionParam = swUrl.searchParams.get('v');
    if (versionParam) {
      return `v${versionParam}`;
    }
  } catch (error) {
    console.warn('[Service Worker] Failed to read version param:', error);
  }

  return 'v' + new Date().toISOString().split('T')[0]; // Format: v2026-02-05
};

const CACHE_VERSION = getCacheVersion();
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;

// Critical assets to cache immediately
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-512x512.svg',
  '/icons/icon-192x192.svg',
  '/icons/icon-152x152.svg',
  '/icons/icon-96x96.svg',
  '/icons/icon-72x72.svg',
];

// Install event - cache essential assets with new version
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing... Version:', CACHE_VERSION);
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[Service Worker] Precaching critical assets');
        return cache.addAll(PRECACHE_ASSETS).catch((err) => {
          console.warn('[Service Worker] Some assets failed to cache:', err);
          // Continue even if some assets fail to download
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches and claim clients
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            // Delete old version caches
            const isOldCache = 
              (cacheName.startsWith('static-') ||
               cacheName.startsWith('dynamic-') ||
               cacheName.startsWith('api-') ||
               cacheName === 'eden-pos-v1' ||
               cacheName === 'eden-pos-runtime') &&
              !cacheName.includes(CACHE_VERSION);
            return isOldCache;
          })
          .map((cacheName) => {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => {
      console.log('[Service Worker] Claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch event - intelligent caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // HTML pages - Network first with cache fallback
  if (request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful HTML (new deployments)
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cached version
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || createOfflineResponse();
          });
        })
    );
    return;
  }

  // JavaScript & CSS - Cache first (with version hash, updates on new deploy)
  if (request.destination === 'script' || request.destination === 'style') {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          return fetch(request)
            .then((response) => {
              // Cache successful responses
              if (response.status === 200) {
                const responseClone = response.clone();
                caches.open(DYNAMIC_CACHE).then((cache) => {
                  cache.put(request, responseClone);
                });
              }
              return response;
            })
            .catch(() => {
              console.warn('[Service Worker] Failed to fetch:', request.url);
              return null;
            });
        })
    );
    return;
  }

  // Images - Cache first, network fallback
  if (request.destination === 'image') {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          return fetch(request)
            .then((response) => {
              // Cache successful image responses
              if (response.status === 200) {
                const responseClone = response.clone();
                caches.open(DYNAMIC_CACHE).then((cache) => {
                  cache.put(request, responseClone);
                });
              }
              return response;
            })
            .catch(() => {
              return createPlaceholderImage();
            });
        })
    );
    return;
  }

  // API requests - Network first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses
          if (response.status === 200 && request.method === 'GET') {
            const responseClone = response.clone();
            caches.open(API_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cached API response
          return caches.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                console.log('[Service Worker] Serving API from cache:', request.url);
                return cachedResponse;
              }
              return createErrorResponse('API offline - no cached data available');
            });
        })
    );
    return;
  }

  // Default - Network first, cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request)
          .then((cachedResponse) => {
            return cachedResponse || createErrorResponse('Offline - Resource unavailable');
          });
      })
  );
});

// Message handling - for cache control from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[Service Worker] SKIP_WAITING requested');
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('[Service Worker] Clearing all caches');
    caches.keys().then((cacheNames) => {
      cacheNames.forEach((cacheName) => {
        caches.delete(cacheName);
      });
    });
  }

  if (event.data && event.data.type === 'CACHE_URLS') {
    console.log('[Service Worker] Caching additional URLs:', event.data.urls);
    caches.open(DYNAMIC_CACHE).then((cache) => {
      cache.addAll(event.data.urls).catch((err) => {
        console.warn('[Service Worker] Error caching URLs:', err);
      });
    });
  }
});

// Helper functions for offline responses
function createOfflineResponse() {
  return new Response(
    `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Offline - EdenDrop</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #1a472a 0%, #2d5a3d 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            color: white;
          }
          .container {
            text-align: center;
            padding: 20px;
            max-width: 500px;
          }
          .emoji {
            font-size: 64px;
            margin-bottom: 20px;
            display: block;
          }
          h1 {
            font-size: 24px;
            margin-bottom: 10px;
            font-weight: 600;
          }
          p {
            font-size: 16px;
            opacity: 0.9;
            line-height: 1.6;
          }
          .status {
            margin-top: 30px;
            padding: 15px;
            background: rgba(255,255,255,0.1);
            border-radius: 8px;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <span class="emoji">📡</span>
          <h1>EdenDrop Offline</h1>
          <p>You are currently offline or the connection is unstable.</p>
          <p>Some features are limited, but cached data will still be available.</p>
          <div class="status">
            <strong>Status:</strong> Waiting for connection...
          </div>
        </div>
      </body>
    </html>`,
    {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, no-cache',
      },
      status: 503,
      statusText: 'Service Unavailable',
    }
  );
}

function createErrorResponse(message) {
  return new Response(
    JSON.stringify({
      error: message,
      offline: true,
      timestamp: new Date().toISOString(),
      cached: true,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache',
      },
      status: 503,
    }
  );
}

function createPlaceholderImage() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
    <rect width="100" height="100" fill="#e5e7eb"/>
    <text x="50" y="60" text-anchor="middle" font-size="40" fill="#9ca3af" font-weight="bold">?</text>
  </svg>`;
  
  return new Response(svg, {
    headers: { 'Content-Type': 'image/svg+xml' },
  });
}
