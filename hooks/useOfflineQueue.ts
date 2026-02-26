import { useState, useEffect, useCallback, useRef } from 'react';
import type { OfflineQueueItem, OfflineState } from '../types/features';

const QUEUE_STORAGE_KEY = 'scout360_offline_queue';
const SYNC_INTERVAL = 30000; // 30 seconds

export function useOfflineQueue() {
  const [state, setState] = useState<OfflineState>({
    isOffline: false,
    queue: [],
    lastSyncAt: null,
    pendingChanges: 0,
  });
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load queue from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const loadQueue = () => {
      try {
        const saved = localStorage.getItem(QUEUE_STORAGE_KEY);
        if (saved) {
          const queue: OfflineQueueItem[] = JSON.parse(saved);
          setState(prev => ({
            ...prev,
            queue,
            pendingChanges: queue.length,
          }));
        }
      } catch {
        console.error('Failed to load offline queue');
      }
    };

    loadQueue();
  }, []);

  // Save queue to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(state.queue));
    } catch {
      console.error('Failed to save offline queue');
    }
  }, [state.queue]);

  // Monitor online status
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setState(prev => ({ ...prev, isOffline: false }));
      processQueue();
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOffline: true }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set initial state
    setState(prev => ({ ...prev, isOffline: !navigator.onLine }));

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-sync when online
  useEffect(() => {
    if (!state.isOffline && state.queue.length > 0) {
      syncIntervalRef.current = setInterval(() => {
        processQueue();
      }, SYNC_INTERVAL);
    }

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [state.isOffline, state.queue.length]);

  const addToQueue = useCallback((item: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'retryCount'>) => {
    const newItem: OfflineQueueItem = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
    };

    setState(prev => ({
      ...prev,
      queue: [...prev.queue, newItem],
      pendingChanges: prev.pendingChanges + 1,
    }));

    return newItem.id;
  }, []);

  const removeFromQueue = useCallback((itemId: string) => {
    setState(prev => ({
      ...prev,
      queue: prev.queue.filter(item => item.id !== itemId),
      pendingChanges: Math.max(0, prev.pendingChanges - 1),
    }));
  }, []);

  const updateQueueItem = useCallback((itemId: string, updates: Partial<OfflineQueueItem>) => {
    setState(prev => ({
      ...prev,
      queue: prev.queue.map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      ),
    }));
  }, []);

  const incrementRetry = useCallback((itemId: string) => {
    setState(prev => ({
      ...prev,
      queue: prev.queue.map(item =>
        item.id === itemId 
          ? { ...item, retryCount: item.retryCount + 1 }
          : item
      ),
    }));
  }, []);

  const clearQueue = useCallback(() => {
    setState(prev => ({
      ...prev,
      queue: [],
      pendingChanges: 0,
      lastSyncAt: Date.now(),
    }));
  }, []);

  const processQueue = useCallback(async () => {
    if (state.isOffline || state.queue.length === 0) return;

    const itemsToProcess = state.queue.filter(
      item => item.retryCount < item.maxRetries
    );

    for (const item of itemsToProcess) {
      try {
        // Process item based on type
        switch (item.type) {
          case 'message':
            // Message will be sent when back online
            break;
          case 'export':
            // Export will be processed
            break;
          case 'sync':
            // Sync operation
            break;
        }
        
        // Remove successfully processed item
        removeFromQueue(item.id);
      } catch {
        // Increment retry count on failure
        incrementRetry(item.id);
      }
    }

    setState(prev => ({
      ...prev,
      lastSyncAt: Date.now(),
    }));
  }, [state.isOffline, state.queue, removeFromQueue, incrementRetry]);

  const queueMessage = useCallback((text: string, sessionId: string) => {
    return addToQueue({
      type: 'message',
      payload: { text, sessionId },
      maxRetries: 3,
    });
  }, [addToQueue]);

  return {
    ...state,
    addToQueue,
    removeFromQueue,
    updateQueueItem,
    incrementRetry,
    clearQueue,
    processQueue,
    queueMessage,
  };
}
