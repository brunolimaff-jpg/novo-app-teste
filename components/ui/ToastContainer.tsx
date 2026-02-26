import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Toast } from '../../hooks/useToast';

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

const positionClasses: Record<string, string> = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
};

const toastIcons: Record<Toast['type'], string> = {
  success: '✅',
  error: '❌',
  info: 'ℹ️',
  warning: '⚠️',
};

const toastColors: Record<Toast['type'], string> = {
  success: 'bg-emerald-500 border-emerald-600',
  error: 'bg-red-500 border-red-600',
  info: 'bg-blue-500 border-blue-600',
  warning: 'bg-amber-500 border-amber-600',
};

export const ToastContainer: React.FC<ToastContainerProps> = memo(({
  toasts,
  onDismiss,
  position = 'top-right',
}) => {
  return (
    <div className={`fixed z-[100] flex flex-col gap-2 ${positionClasses[position]}`}>
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white min-w-[280px] max-w-md ${toastColors[toast.type]}`}
          >
            <span className="text-lg">{toastIcons[toast.type]}</span>
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-white/70 hover:text-white transition-colors"
              aria-label="Fechar notificação"
            >
              ×
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
});

ToastContainer.displayName = 'ToastContainer';
