import { useState, useEffect, useCallback, useRef } from 'react';

interface UseOfflineReturn {
  isOnline: boolean;
  wasOffline: boolean;
  clearWasOffline: () => void;
  offlineAt: Date | null;
  onlineAt: Date | null;
  offlineDuration: number; // em segundos
}

export function useOffline(): UseOfflineReturn {
  const [isOnline, setIsOnline] = useState(() => 
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState(false);
  const [offlineAt, setOfflineAt] = useState<Date | null>(null);
  const [onlineAt, setOnlineAt] = useState<Date | null>(null);
  const [offlineDuration, setOfflineDuration] = useState(0);
  const offlineStartRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      const now = Date.now();
      setIsOnline(true);
      setWasOffline(true);
      setOnlineAt(new Date());
      
      if (offlineStartRef.current) {
        setOfflineDuration(Math.floor((now - offlineStartRef.current) / 1000));
        offlineStartRef.current = null;
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(false);
      setOfflineAt(new Date());
      offlineStartRef.current = Date.now();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const clearWasOffline = useCallback(() => {
    setWasOffline(false);
  }, []);

  return { 
    isOnline, 
    wasOffline, 
    clearWasOffline,
    offlineAt,
    onlineAt,
    offlineDuration,
  };
}
