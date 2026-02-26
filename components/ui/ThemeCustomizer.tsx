import React, { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CustomTheme } from '../../types/features';

interface ThemeCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
  themes: CustomTheme[];
  activeTheme: CustomTheme;
  customThemes: CustomTheme[];
  onSetTheme: (themeId: string) => void;
  onCreateTheme: (theme: Omit<CustomTheme, 'id' | 'isDefault'>) => string | undefined;
  onDeleteTheme: (themeId: string) => void;
  onDuplicateTheme: (themeId: string, newName: string) => string | undefined;
  isDarkMode?: boolean;
}

const colorLabels: Record<string, string> = {
  primary: 'Primária',
  secondary: 'Secundária',
  accent: 'Destaque',
  background: 'Fundo',
  surface: 'Superfície',
  text: 'Texto',
  textMuted: 'Texto Secundário',
  border: 'Borda',
  success: 'Sucesso',
  warning: 'Aviso',
  error: 'Erro',
  info: 'Info',
};

export const ThemeCustomizer: React.FC<ThemeCustomizerProps> = memo(({
  isOpen,
  onClose,
  themes,
  activeTheme,
  customThemes,
  onSetTheme,
  onCreateTheme,
  onDeleteTheme,
  onDuplicateTheme,
  isDarkMode = false,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newTheme, setNewTheme] = useState<Partial<CustomTheme>>({
    name: '',
    isDark: false,
    colors: {
      primary: '#10b981',
      secondary: '#3b82f6',
      accent: '#f59e0b',
      background: '#f8fafc',
      surface: '#ffffff',
      text: '#0f172a',
      textMuted: '#64748b',
      border: '#e2e8f0',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
  });

  const handleCreate = () => {
    if (newTheme.name && newTheme.colors) {
      onCreateTheme(newTheme as Omit<CustomTheme, 'id' | 'isDefault'>);
      setIsCreating(false);
      setNewTheme({
        name: '',
        isDark: false,
        colors: {
          primary: '#10b981',
          secondary: '#3b82f6',
          accent: '#f59e0b',
          background: '#f8fafc',
          surface: '#ffffff',
          text: '#0f172a',
          textMuted: '#64748b',
          border: '#e2e8f0',
          success: '#22c55e',
          warning: '#f59e0b',
          error: '#ef4444',
          info: '#3b82f6',
        },
      });
    }
  };

  const handleColorChange = (colorKey: string, value: string) => {
    setNewTheme(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        [colorKey]: value,
      } as CustomTheme['colors'],
    }));
  };

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

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed right-0 top-0 bottom-0 w-full max-w-md z-50 shadow-2xl flex flex-col ${
              isDarkMode ? 'bg-slate-900 border-l border-slate-700' : 'bg-white border-l border-gray-200'
            }`}
          >
            {/* Header */}
            <div className={`p-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Personalizar Tema
                  </h2>
                  <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    {themes.length} temas disponíveis
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className={`p-2 rounded-lg transition-colors ${
                    isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-gray-100 text-gray-500'
                  }`}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Create Button */}
            <div className="p-4">
              <button
                onClick={() => setIsCreating(true)}
                className="w-full py-2 rounded-lg border-2 border-dashed border-emerald-500 text-emerald-500 font-medium hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
              >
                + Criar tema personalizado
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isCreating ? (
                <div className={`p-4 rounded-xl border ${isDarkMode ? 'border-slate-700 bg-slate-800/50' : 'border-gray-200 bg-gray-50'}`}>
                  <h3 className={`font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Novo Tema
                  </h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={newTheme.name}
                      onChange={e => setNewTheme(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nome do tema"
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${
                        isDarkMode
                          ? 'bg-slate-900 border-slate-700 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isDark"
                        checked={newTheme.isDark}
                        onChange={e => setNewTheme(prev => ({ ...prev, isDark: e.target.checked }))}
                        className="w-4 h-4 rounded"
                      />
                      <label htmlFor="isDark" className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                        Tema escuro
                      </label>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {newTheme.colors && Object.entries(newTheme.colors).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2">
                          <input
                            type="color"
                            value={value}
                            onChange={e => handleColorChange(key, e.target.value)}
                            className="w-8 h-8 rounded cursor-pointer"
                          />
                          <span className={`text-sm flex-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                            {colorLabels[key] || key}
                          </span>
                          <span className={`text-xs font-mono ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCreate}
                        className="flex-1 py-2 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600"
                      >
                        Criar
                      </button>
                      <button
                        onClick={() => setIsCreating(false)}
                        className={`flex-1 py-2 rounded-lg border ${
                          isDarkMode ? 'border-slate-700 text-slate-300' : 'border-gray-300 text-gray-600'
                        }`}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Default Themes */}
                  <section>
                    <h3 className={`text-sm font-semibold uppercase tracking-wider mb-3 ${
                      isDarkMode ? 'text-slate-500' : 'text-gray-400'
                    }`}>
                      Temas Padrão
                    </h3>
                    <div className="space-y-2">
                      {themes.filter(t => t.isDefault).map(theme => (
                        <button
                          key={theme.id}
                          onClick={() => onSetTheme(theme.id)}
                          className={`w-full p-3 rounded-xl border text-left transition-all ${
                            activeTheme.id === theme.id
                              ? 'ring-2 ring-emerald-500'
                              : isDarkMode
                                ? 'border-slate-700 bg-slate-800/50 hover:bg-slate-800'
                                : 'border-gray-200 bg-white hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-8 h-8 rounded-lg"
                                style={{ backgroundColor: theme.colors.primary }}
                              />
                              <div>
                                <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {theme.name}
                                </h4>
                                <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                                  {theme.isDark ? 'Escuro' : 'Claro'}
                                </p>
                              </div>
                            </div>
                            {activeTheme.id === theme.id && (
                              <span className="text-emerald-500">✓</span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>

                  {/* Custom Themes */}
                  {customThemes.length > 0 && (
                    <section>
                      <h3 className={`text-sm font-semibold uppercase tracking-wider mb-3 ${
                        isDarkMode ? 'text-slate-500' : 'text-gray-400'
                      }`}>
                        Temas Personalizados
                      </h3>
                      <div className="space-y-2">
                        {customThemes.map(theme => (
                          <div
                            key={theme.id}
                            className={`p-3 rounded-xl border ${
                              activeTheme.id === theme.id
                                ? 'ring-2 ring-emerald-500'
                                : isDarkMode
                                  ? 'border-slate-700 bg-slate-800/50'
                                  : 'border-gray-200 bg-white'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <button
                                onClick={() => onSetTheme(theme.id)}
                                className="flex-1 flex items-center gap-3 text-left"
                              >
                                <div
                                  className="w-8 h-8 rounded-lg"
                                  style={{ backgroundColor: theme.colors.primary }}
                                />
                                <div>
                                  <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {theme.name}
                                  </h4>
                                  <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                                    {theme.isDark ? 'Escuro' : 'Claro'}
                                  </p>
                                </div>
                              </button>
                              <div className="flex items-center gap-1">
                                {activeTheme.id === theme.id && (
                                  <span className="text-emerald-500 mr-2">✓</span>
                                )}
                                <button
                                  onClick={() => {
                                    const name = prompt('Nome do novo tema:', `${theme.name} (cópia)`);
                                    if (name) onDuplicateTheme(theme.id, name);
                                  }}
                                  className={`p-1.5 rounded-lg ${
                                    isDarkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500'
                                  }`}
                                  title="Duplicar"
                                >
                                  📋
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm('Tem certeza que deseja excluir este tema?')) {
                                      onDeleteTheme(theme.id);
                                    }
                                  }}
                                  className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  title="Excluir"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

ThemeCustomizer.displayName = 'ThemeCustomizer';
