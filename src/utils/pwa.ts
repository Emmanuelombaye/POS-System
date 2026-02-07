/**
 * PWA Service Worker Registration & Management
 * Handles offline functionality, caching, and app installation
 */

import { APP_VERSION } from "@/lib/updateManager";

export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register(`/service-worker.js?v=${APP_VERSION}`, {
        scope: '/',
        updateViaCache: 'none', // Always check for SW updates
      });

      console.log('[PWA] Service Worker registered successfully:', registration.scope);

      // Check for updates every hour
      const updateCheckInterval = setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000);

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[PWA] New version available! Prompting user to refresh.');
              
              // Notify user about update
              const message = {
                type: 'UPDATE_AVAILABLE',
                timestamp: new Date().toISOString(),
              };

              // Send message to all clients
              if (registration.active) {
                registration.active.postMessage(message);
              }

              // Optional: Auto-refresh after 30 seconds of inactivity
              setTimeout(() => {
                if (confirm('New version of EdenDrop is available. Reload now?')) {
                  window.location.reload();
                }
              }, 30000);
            }
          });
        }
      });

      // Cleanup on unload
      window.addEventListener('beforeunload', () => {
        clearInterval(updateCheckInterval);
      });

      return registration;
    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error);
    }
  } else {
    console.warn('[PWA] Service Workers not supported in this browser');
  }
};

/**
 * Check if app can be installed (PWA)
 */
export const canInstallPWA = () => {
  return 'BeforeInstallPromptEvent' in window || 
         (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
};

/**
 * Check if app is already installed
 */
export const isAppInstalled = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true; // iOS
};

/**
 * Prompt user to install PWA
 */
let deferredPrompt: any = null;

export const initInstallPrompt = () => {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log('[PWA] Install prompt ready');
  });

  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App installed successfully');
    deferredPrompt = null;
  });
};

export const showInstallPrompt = async () => {
  if (!deferredPrompt) {
    console.warn('[PWA] Install prompt not available');
    return false;
  }

  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  console.log(`[PWA] User response: ${outcome}`);
  deferredPrompt = null;
  return outcome === 'accepted';
};

/**
 * Request background sync permission
 */
export const requestBackgroundSync = async (tag: string = 'sync-transactions') => {
  if ('serviceWorker' in navigator && 'sync' in (ServiceWorkerRegistration.prototype as any)) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).sync.register(tag);
      console.log('[PWA] Background sync registered:', tag);
      return true;
    } catch (error) {
      console.error('[PWA] Background sync failed:', error);
      return false;
    }
  }
  return false;
};

/**
 * Check if device is online
 */
export const isOnline = () => navigator.onLine;

/**
 * Listen for online/offline events
 */
export const addNetworkListener = (
  onOnline: () => void,
  onOffline: () => void
) => {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);

  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
};
