import { useRef, useCallback } from 'react';
import type { CacheEntry } from '../types';

export function useCache<T>(defaultTtl = 5 * 60 * 1000) {
  const cacheRef = useRef<Map<string, CacheEntry<T>>>(new Map());

  const get = useCallback((key: string): T | null => {
    const entry = cacheRef.current.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      cacheRef.current.delete(key);
      return null;
    }

    return entry.data;
  }, []);

  const set = useCallback((key: string, data: T, ttl = defaultTtl) => {
    cacheRef.current.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }, [defaultTtl]);

  const remove = useCallback((key: string) => {
    cacheRef.current.delete(key);
  }, []);

  const clear = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  const has = useCallback((key: string): boolean => {
    const entry = cacheRef.current.get(key);
    if (!entry) return false;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      cacheRef.current.delete(key);
      return false;
    }

    return true;
  }, []);

  return { get, set, remove, clear, has };
}

export function useRequestDeduplication<T>() {
  const pendingRef = useRef<Map<string, Promise<T>>>(new Map());

  const dedupe = useCallback(async (key: string, fn: () => Promise<T>): Promise<T> => {
    const pending = pendingRef.current.get(key);
    if (pending) {
      return pending;
    }

    const promise = fn().finally(() => {
      pendingRef.current.delete(key);
    });

    pendingRef.current.set(key, promise);
    return promise;
  }, []);

  const clear = useCallback(() => {
    pendingRef.current.clear();
  }, []);

  return { dedupe, clear };
}
