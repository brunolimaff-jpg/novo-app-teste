import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { KeyboardShortcut } from '../../types/features';

interface KeyboardCheatSheetProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: KeyboardShortcut[];
  formatShortcut: (shortcut: KeyboardShortcut) => string;
  isDarkMode?: boolean;
  onMarkSeen?: () => void;
}

const categoryOrder = ['navegação', 'ação', 'visualização', 'edição'];

const categoryLabels: Record<string, string> = {
  navegação: 'Navegação',
  ação: 'Ações',
  visualização: 'Visualização',
  edição: 'Edição',
};

export const KeyboardCheatSheet: React.FC<KeyboardCheatSheetProps> = memo(({
  isOpen,
  onClose,
  shortcuts,
  formatShortcut,
  isDarkMode = false,
  onMarkSeen,
}) => {
  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, KeyboardShortcut[]>);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl md:max-h-[80vh] z-50 rounded-xl shadow-2xl overflow-hidden flex flex-col ${
              isDarkMode ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-gray-200'
            }`}
          >
            {/* Header */}
            <div className={`p-4 border-b flex items-center justify-between ${
              isDarkMode ? 'border-slate-700' : 'border-gray-200'
            }`}>
              <div>
                <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Atalhos de Teclado
                </h2>
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                  Pressione <kbd className={`px-1 rounded ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`}>?</kbd> a qualquer momento para abrir
                </p>
              </div>
              <button
                onClick={onClose}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-gray-100 text-gray-500'
                }`}
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {categoryOrder.map(category => {
                  const categoryShortcuts = groupedShortcuts[category];
                  if (!categoryShortcuts?.length) return null;

                  return (
                    <div key={category}>
                      <h3 className={`text-sm font-semibold uppercase tracking-wider mb-3 ${
                        isDarkMode ? 'text-slate-500' : 'text-gray-400'
                      }`}>
                        {categoryLabels[category]}
                      </h3>
                      <div className="space-y-2">
                        {categoryShortcuts.map(shortcut => (
                          <div
                            key={shortcut.id}
                            className={`flex items-center justify-between p-2 rounded-lg ${
                              isDarkMode ? 'bg-slate-800/50' : 'bg-gray-50'
                            }`}
                          >
                            <span className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                              {shortcut.description}
                            </span>
                            <kbd className={`px-2 py-1 rounded text-xs font-mono ${
                              isDarkMode ? 'bg-slate-700 text-slate-200' : 'bg-gray-200 text-gray-700'
                            }`}>
                              {formatShortcut(shortcut)}
                            </kbd>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Vim Mode */}
              <div className={`mt-6 p-4 rounded-lg ${isDarkMode ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
                <h3 className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  Modo Vim (Experimental)
                </h3>
                <p className={`text-xs mb-3 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                  Navegue como no Vim. Pressione <kbd className={`px-1 rounded ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`}>j</kbd> para baixo, <kbd className={`px-1 rounded ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`}>k</kbd> para cima.
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className={`p-2 rounded ${isDarkMode ? 'bg-slate-700' : 'bg-white'}`}>
                    <kbd className="font-mono">gg</kbd> → Topo da página
                  </div>
                  <div className={`p-2 rounded ${isDarkMode ? 'bg-slate-700' : 'bg-white'}`}>
                    <kbd className="font-mono">G</kbd> → Fim da página
                  </div>
                  <div className={`p-2 rounded ${isDarkMode ? 'bg-slate-700' : 'bg-white'}`}>
                    <kbd className="font-mono">j</kbd> → Scroll para baixo
                  </div>
                  <div className={`p-2 rounded ${isDarkMode ? 'bg-slate-700' : 'bg-white'}`}>
                    <kbd className="font-mono">k</kbd> → Scroll para cima
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className={`p-4 border-t flex justify-between items-center ${
              isDarkMode ? 'border-slate-700' : 'border-gray-200'
            }`}>
              <span className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                Dica: Use <kbd className={`px-1 rounded ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`}>Tab</kbd> para navegar entre elementos
              </span>
              {onMarkSeen && (
                <button
                  onClick={onMarkSeen}
                  className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors"
                >
                  Entendi, não mostrar novamente
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

KeyboardCheatSheet.displayName = 'KeyboardCheatSheet';
