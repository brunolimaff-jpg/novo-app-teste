import { useState, useCallback, useRef } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
  createdAt: number;
}

interface ToastOptions {
  duration?: number;
  id?: string;
}

const DEFAULT_DURATION = 4000;
const MAX_TOASTS = 5;

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const add = useCallback(
    (type: ToastType, message: string, options: ToastOptions = {}) => {
      const id = options.id || `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const duration = options.duration || DEFAULT_DURATION;
      
      // Remove toast existente com mesmo ID
      if (options.id) {
        dismiss(options.id);
      }

      const newToast: Toast = {
        id,
        type,
        message,
        duration,
        createdAt: Date.now(),
      };

      setToasts((prev) => {
        const filtered = options.id ? prev.filter(t => t.id !== options.id) : prev;
        return [...filtered.slice(-MAX_TOASTS + 1), newToast];
      });

      const timer = setTimeout(() => {
        dismiss(id);
      }, duration);
      
      timersRef.current.set(id, timer);

      return id;
    },
    [dismiss]
  );

  const toast = {
    success: (msg: string, opts?: ToastOptions) => add('success', msg, opts),
    error: (msg: string, opts?: ToastOptions) => add('error', msg, { ...opts, duration: opts?.duration || 6000 }),
    info: (msg: string, opts?: ToastOptions) => add('info', msg, opts),
    warning: (msg: string, opts?: ToastOptions) => add('warning', msg, { ...opts, duration: opts?.duration || 5000 }),
  };

  const clearAll = useCallback(() => {
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current.clear();
    setToasts([]);
  }, []);

  const updateMessage = useCallback((id: string, message: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, message } : t))
    );
  }, []);

  return { toasts, toast, dismiss, clearAll, updateMessage };
}
