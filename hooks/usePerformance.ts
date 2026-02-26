import { useEffect, useRef, useCallback } from 'react';
import type { PerformanceMetrics } from '../types';

export function usePerformanceMonitor(onMetrics?: (metrics: PerformanceMetrics) => void) {
  const metricsRef = useRef<Partial<PerformanceMetrics>>({});

  useEffect(() => {
    if (typeof window === 'undefined' || !('performance' in window)) return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'web-vitals') {
          const metric = entry as PerformanceEntry & { value: number; name: string };
          
          switch (metric.name) {
            case 'FCP':
              metricsRef.current.fcp = metric.value;
              break;
            case 'LCP':
              metricsRef.current.lcp = metric.value;
              break;
            case 'CLS':
              metricsRef.current.cls = metric.value;
              break;
            case 'FID':
              metricsRef.current.fid = metric.value;
              break;
            case 'TTFB':
              metricsRef.current.ttfb = metric.value;
              break;
          }

          if (
            metricsRef.current.fcp &&
            metricsRef.current.lcp &&
            metricsRef.current.cls !== undefined &&
            metricsRef.current.fid &&
            metricsRef.current.ttfb
          ) {
            onMetrics?.(metricsRef.current as PerformanceMetrics);
          }
        }
      }
    });

    try {
      observer.observe({ entryTypes: ['web-vitals'] as unknown as PerformanceEntryType });
    } catch {
      // Fallback para navegadores sem suporte
    }

    return () => {
      observer.disconnect();
    };
  }, [onMetrics]);
}

export function useIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit
) {
  const observerRef = useRef<IntersectionObserver | null>(null);

  const observe = useCallback((element: Element) => {
    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver(callback, options);
    }
    observerRef.current.observe(element);
  }, [callback, options]);

  const unobserve = useCallback((element: Element) => {
    observerRef.current?.unobserve(element);
  }, []);

  const disconnect = useCallback(() => {
    observerRef.current?.disconnect();
    observerRef.current = null;
  }, []);

  return { observe, unobserve, disconnect };
}
