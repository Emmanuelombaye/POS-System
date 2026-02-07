const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// ============================================================================
// OFFLINE SUPPORT: Cache & Sync Queue
// ============================================================================

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number; // milliseconds
}

interface QueuedRequest {
  id: string;
  method: 'POST' | 'PATCH' | 'DELETE';
  endpoint: string;
  data: any;
  timestamp: number;
  retries: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const OFFLINE_STORAGE_KEY = 'offline_cache';
const SYNC_QUEUE_KEY = 'sync_queue';

// Check if online
export const isOnline = () => {
  return navigator.onLine && window.netConnectivity !== false;
};

// Check if we have any cached data (for offline indication)
export const hasOfflineData = (endpoint: string): boolean => {
  try {
    const cacheData = localStorage.getItem(OFFLINE_STORAGE_KEY);
    if (!cacheData) return false;
    const cache = JSON.parse(cacheData) as Record<string, CacheEntry>;
    return !!cache[endpoint];
  } catch {
    return false;
  }
};

// Get from local cache
const getFromCache = (endpoint: string): any | null => {
  try {
    const cacheData = localStorage.getItem(OFFLINE_STORAGE_KEY);
    if (!cacheData) return null;
    
    const cache = JSON.parse(cacheData) as Record<string, CacheEntry>;
    const entry = cache[endpoint];
    
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      delete cache[endpoint];
      localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(cache));
      return null;
    }
    
    return entry.data;
  } catch (err) {
    console.error('[CACHE] Error reading from cache:', err);
    return null;
  }
};

// Save to local cache
const saveToCache = (endpoint: string, data: any, ttl = CACHE_TTL) => {
  try {
    const cacheData = localStorage.getItem(OFFLINE_STORAGE_KEY);
    const cache = cacheData ? JSON.parse(cacheData) : {};
    
    cache[endpoint] = {
      data,
      timestamp: Date.now(),
      ttl,
    };
    
    localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(cache));
    console.log('[CACHE] Saved to cache:', endpoint);
  } catch (err) {
    console.error('[CACHE] Error saving to cache:', err);
  }
};

// Add to sync queue
const addToQueue = (method: 'POST' | 'PATCH' | 'DELETE', endpoint: string, data: any) => {
  try {
    const queueData = localStorage.getItem(SYNC_QUEUE_KEY);
    const queue: QueuedRequest[] = queueData ? JSON.parse(queueData) : [];
    
    const request: QueuedRequest = {
      id: `${Date.now()}-${Math.random()}`,
      method,
      endpoint,
      data,
      timestamp: Date.now(),
      retries: 0,
    };
    
    queue.push(request);
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    console.log('[QUEUE] Added to sync queue:', endpoint, method);
    
    return request;
  } catch (err) {
    console.error('[QUEUE] Error adding to queue:', err);
    return null;
  }
};

// Get sync queue
const getSyncQueue = (): QueuedRequest[] => {
  try {
    const queueData = localStorage.getItem(SYNC_QUEUE_KEY);
    return queueData ? JSON.parse(queueData) : [];
  } catch (err) {
    console.error('[QUEUE] Error reading queue:', err);
    return [];
  }
};

// Remove from sync queue
const removeFromQueue = (requestId: string) => {
  try {
    const queue = getSyncQueue();
    const updated = queue.filter(r => r.id !== requestId);
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(updated));
    console.log('[QUEUE] Removed from queue:', requestId);
  } catch (err) {
    console.error('[QUEUE] Error removing from queue:', err);
  }
};

// Sync queued requests when back online
export const syncOfflineQueue = async () => {
  if (!isOnline()) {
    console.log('[SYNC] Still offline, cannot sync');
    return;
  }

  console.log('[SYNC] Starting sync of offline queue...');
  const queue = getSyncQueue();
  
  if (queue.length === 0) {
    console.log('[SYNC] Queue is empty');
    return;
  }

  for (const request of queue) {
    try {
      console.log(`[SYNC] Processing: ${request.method} ${request.endpoint}`);
      
      let response;
      if (request.method === 'POST') {
        response = await makeRequest('POST', request.endpoint, request.data);
      } else if (request.method === 'PATCH') {
        response = await makeRequest('PATCH', request.endpoint, request.data);
      } else if (request.method === 'DELETE') {
        response = await makeRequest('DELETE', request.endpoint, null);
      }

      if (response) {
        removeFromQueue(request.id);
        console.log(`[SYNC] ✓ Successfully synced: ${request.endpoint}`);
      }
    } catch (err) {
      console.error(`[SYNC] Failed to sync: ${request.endpoint}`, err);
      // Retry count could be incremented here for smarter retry strategies
    }
  }

  console.log('[SYNC] Sync complete');
};

// Raw request function
const makeRequest = async (method: 'GET' | 'POST' | 'PATCH' | 'DELETE', endpoint: string, data: any = null) => {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers: getHeaders(),
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    let errorMessage = `API Error: ${response.statusText}`;
    try {
      const errorBody = await response.json();
      if (errorBody?.error) errorMessage = errorBody.error;
    } catch (_err) {
      // ignore
    }
    throw new Error(errorMessage);
  }

  return response.json();
};

const getStoredToken = () => {
    try {
        const directToken = localStorage.getItem('token');
        if (directToken) return directToken;

        const persistedState = localStorage.getItem('eden-drop-001-state');
        if (persistedState) {
            const { state } = JSON.parse(persistedState);
            if (state?.token) return state.token as string;
        }
    } catch (e) {
        console.error("Error reading token from localStorage", e);
    }

    return undefined;
};

const getHeaders = () => {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    const token = getStoredToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
};

const buildQueryString = (params?: Record<string, string | number | boolean | undefined>) => {
    if (!params) return "";
    const entries = Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== null && value !== "")
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    return entries.length ? `?${entries.join("&")}` : "";
};

export const api = {
    async get(endpoint: string, params?: Record<string, string | number | boolean | undefined>) {
        const query = buildQueryString(params);
        const fullEndpoint = `${endpoint}${query}`;
        
        try {
            if (!isOnline()) {
                console.log('[OFFLINE] GET request, trying cache:', fullEndpoint);
                const cached = getFromCache(fullEndpoint);
                if (cached) {
                    console.log('[OFFLINE] ✓ Using cached data:', fullEndpoint);
                    return cached;
                }
                throw new Error('No internet connection and no cached data available');
            }

            const res = await fetch(`${API_URL}${fullEndpoint}`, {
                headers: getHeaders(),
            });

            if (res.status === 401 || res.status === 403) {
                throw new Error('Unauthorized. Please login again.');
            }
            if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
            
            const data = await res.json();
            // Cache successful GET responses
            saveToCache(fullEndpoint, data);
            return data;
        } catch (err) {
            console.error('[API] GET error:', err);
            // Try cache as fallback
            const cached = getFromCache(fullEndpoint);
            if (cached) {
                console.log('[FALLBACK] Using cached data after error:', fullEndpoint);
                return cached;
            }
            throw err;
        }
    },

    async post(endpoint: string, data: any) {
        try {
            if (!isOnline()) {
                console.log('[OFFLINE] POST queued:', endpoint);
                // Queue the request for later sync
                addToQueue('POST', endpoint, data);
                // Return optimistic response so UI doesn't break
                return { success: true, offline: true, message: 'Request queued - will sync when online' };
            }

            return await makeRequest('POST', endpoint, data);
        } catch (err) {
            console.error('[API] POST error:', err);
            // Queue for retry
            console.log('[OFFLINE] POST failed, queuing for retry:', endpoint);
            addToQueue('POST', endpoint, data);
            throw err;
        }
    },

    async patch(endpoint: string, data: any) {
        try {
            if (!isOnline()) {
                console.log('[OFFLINE] PATCH queued:', endpoint);
                addToQueue('PATCH', endpoint, data);
                return { success: true, offline: true, message: 'Request queued - will sync when online' };
            }

            return await makeRequest('PATCH', endpoint, data);
        } catch (err) {
            console.error('[API] PATCH error:', err);
            console.log('[OFFLINE] PATCH failed, queuing for retry:', endpoint);
            addToQueue('PATCH', endpoint, data);
            throw err;
        }
    },

    async delete(endpoint: string) {
        try {
            if (!isOnline()) {
                console.log('[OFFLINE] DELETE queued:', endpoint);
                addToQueue('DELETE', endpoint, null);
                return { success: true, offline: true, message: 'Request queued - will sync when online' };
            }

            return await makeRequest('DELETE', endpoint, null);
        } catch (err) {
            console.error('[API] DELETE error:', err);
            console.log('[OFFLINE] DELETE failed, queuing for retry:', endpoint);
            addToQueue('DELETE', endpoint, null);
            throw err;
        }
    }
};
