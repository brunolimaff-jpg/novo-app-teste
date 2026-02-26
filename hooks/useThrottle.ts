import { useRef, useCallback } from 'react';

export function useThrottle<T extends (...args: unknown[]) => unknown>(
  callback: T,
  limit: number
): (...args: Parameters<T>) => void {
  const lastRunRef = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();

      if (now - lastRunRef.current >= limit) {
        lastRunRef.current = now;
        callback(...args);
      } else if (!timeoutRef.current) {
        timeoutRef.current = setTimeout(() => {
          lastRunRef.current = Date.now();
          timeoutRef.current = null;
          callback(...args);
        }, limit - (now - lastRunRef.current));
      }
    },
    [callback, limit]
  );
}

export function useLeadingThrottle<T extends (...args: unknown[]) => unknown>(
  callback: T,
  limit: number
): (...args: Parameters<T>) => void {
  const lastRunRef = useRef<number>(0);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();

      if (now - lastRunRef.current >= limit) {
        lastRunRef.current = now;
        callback(...args);
      }
    },
    [callback, limit]
  );
}
