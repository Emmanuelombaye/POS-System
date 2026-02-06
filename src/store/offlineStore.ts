import { create } from 'zustand';

interface OfflineStore {
  isOnline: boolean;
  pendingTransactions: any[];
  setOnline: (online: boolean) => void;
  addPendingTransaction: (transaction: any) => void;
  clearPendingTransactions: () => void;
  syncPendingTransactions: () => Promise<void>;
}

export const useOfflineStore = create<OfflineStore>((set, get) => ({
  isOnline: navigator.onLine,
  pendingTransactions: [],

  setOnline: (online: boolean) => {
    set({ isOnline: online });
    if (online) {
      // Auto-sync when coming back online
      get().syncPendingTransactions();
    }
  },

  addPendingTransaction: (transaction: any) => {
    const transactions = get().pendingTransactions;
    set({ 
      pendingTransactions: [...transactions, { 
        ...transaction, 
        timestamp: Date.now(),
        id: `offline-${Date.now()}-${Math.random()}`
      }] 
    });
    
    // Store in localStorage for persistence
    localStorage.setItem(
      'pending_transactions',
      JSON.stringify(get().pendingTransactions)
    );
  },

  clearPendingTransactions: () => {
    set({ pendingTransactions: [] });
    localStorage.removeItem('pending_transactions');
  },

  syncPendingTransactions: async () => {
    const pending = get().pendingTransactions;
    if (pending.length === 0) return;

    console.log('[Offline Sync] Syncing', pending.length, 'transactions...');
    
    try {
      // Send all pending transactions to backend
      const response = await fetch('/api/sync/offline-transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ transactions: pending })
      });

      if (response.ok) {
        console.log('[Offline Sync] Success!');
        get().clearPendingTransactions();
      } else {
        console.error('[Offline Sync] Failed:', response.statusText);
      }
    } catch (error) {
      console.error('[Offline Sync] Error:', error);
    }
  }
}));

// Initialize from localStorage
const savedTransactions = localStorage.getItem('pending_transactions');
if (savedTransactions) {
  try {
    useOfflineStore.setState({ 
      pendingTransactions: JSON.parse(savedTransactions) 
    });
  } catch (e) {
    console.error('[Offline Store] Failed to load saved transactions');
  }
}
