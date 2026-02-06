import { useEffect, useState } from 'react';
import { isOnline, syncOfflineQueue } from '@/utils/api';

/**
 * Hook to handle offline/online state and sync queued requests
 */
export const useOfflineSync = () => {
  const [isConnected, setIsConnected] = useState(isOnline());
  const [syncInProgress, setSyncInProgress] = useState(false);

  useEffect(() => {
    // Monitor connection status
    const handleOnline = async () => {
      console.log('[OFFLINE_SYNC] Connection restored!');
      setIsConnected(true);
      
      // Start syncing queued requests
      setSyncInProgress(true);
      try {
        await syncOfflineQueue();
        console.log('[OFFLINE_SYNC] Sync complete');
      } catch (err) {
        console.error('[OFFLINE_SYNC] Sync error:', err);
      } finally {
        setSyncInProgress(false);
      }
    };

    const handleOffline = () => {
      console.log('[OFFLINE_SYNC] Connection lost');
      setIsConnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isConnected,
    isOffline: !isConnected,
    syncInProgress,
  };
};
