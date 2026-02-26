import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AccessibilitySettings } from '../../types/features';

interface AccessibilityPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AccessibilitySettings;
  onUpdateSetting: <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => void;
  onReset: () => void;
  isDarkMode?: boolean;
}

const colorBlindOptions = [
  { value: 'none', label: 'Normal', description: 'Visão padrão' },
  { value: 'deuteranopia', label: 'Deuteranopia', description: 'Dificuldade com verde' },
  { value: 'protanopia', label: 'Protanopia', description: 'Dificuldade com vermelho' },
  { value: 'tritanopia', label: 'Tritanopia', description: 'Dificuldade com azul' },
] as const;

const focusOptions = [
  { value: 'default', label: 'Padrão' },
  { value: 'enhanced', label: 'Realçado' },
  { value: 'hidden', label: 'Oculto' },
] as const;

export const AccessibilityPanel: React.FC<AccessibilityPanelProps> = memo(({
  isOpen,
  onClose,
  settings,
  onUpdateSetting,
  onReset,
  isDarkMode = false,
}) => {
  const Toggle = ({ 
    label, 
    description, 
    checked, 
    onChange 
  }: { 
    label: string; 
    description?: string; 
    checked: boolean; 
    onChange: () => void;
  }) => (
    <div className="flex items-start justify-between py-3">
      <div>
        <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {label}
        </h4>
        {description && (
          <p className={`text-sm mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
            {description}
          </p>
        )}
      </div>
      <button
        onClick={onChange}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          checked ? 'bg-emerald-500' : isDarkMode ? 'bg-slate-700' : 'bg-gray-300'
        }`}
        aria-pressed={checked}
      >
        <span
          className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );

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
            <div className={`p-4 border-b flex items-center justify-between ${
              isDarkMode ? 'border-slate-700' : 'border-gray-200'
            }`}>
              <div>
                <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Acessibilidade
                </h2>
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                  Personalize sua experiência
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
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Visual */}
              <section>
                <h3 className={`text-sm font-semibold uppercase tracking-wider mb-3 ${
                  isDarkMode ? 'text-slate-500' : 'text-gray-400'
                }`}>
                  Visual
                </h3>
                <div className={`rounded-xl border divide-y ${
                  isDarkMode ? 'border-slate-700 divide-slate-700' : 'border-gray-200 divide-gray-200'
                }`}>
                  <div className="px-4">
                    <Toggle
                      label="Alto contraste"
                      description="Aumenta o contraste entre elementos"
                      checked={settings.highContrast}
                      onChange={() => onUpdateSetting('highContrast', !settings.highContrast)}
                    />
                  </div>
                  <div className="px-4">
                    <Toggle
                      label="Texto grande"
                      description="Aumenta o tamanho da fonte em 25%"
                      checked={settings.largeText}
                      onChange={() => onUpdateSetting('largeText', !settings.largeText)}
                    />
                  </div>
                  <div className="px-4">
                    <Toggle
                      label="Reduzir animações"
                      description="Desativa transições e animações"
                      checked={settings.reduceMotion}
                      onChange={() => onUpdateSetting('reduceMotion', !settings.reduceMotion)}
                    />
                  </div>
                </div>
              </section>

              {/* Foco */}
              <section>
                <h3 className={`text-sm font-semibold uppercase tracking-wider mb-3 ${
                  isDarkMode ? 'text-slate-500' : 'text-gray-400'
                }`}>
                  Indicador de Foco
                </h3>
                <div className={`rounded-xl border p-4 ${
                  isDarkMode ? 'border-slate-700' : 'border-gray-200'
                }`}>
                  <div className="space-y-2">
                    {focusOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => onUpdateSetting('focusIndicator', option.value as AccessibilitySettings['focusIndicator'])}
                        className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                          settings.focusIndicator === option.value
                            ? 'bg-emerald-500 text-white'
                            : isDarkMode
                              ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <span>{option.label}</span>
                        {settings.focusIndicator === option.value && (
                          <span>✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              {/* Daltonismo */}
              <section>
                <h3 className={`text-sm font-semibold uppercase tracking-wider mb-3 ${
                  isDarkMode ? 'text-slate-500' : 'text-gray-400'
                }`}>
                  Modo Daltônico
                </h3>
                <div className={`rounded-xl border p-4 ${
                  isDarkMode ? 'border-slate-700' : 'border-gray-200'
                }`}>
                  <div className="space-y-2">
                    {colorBlindOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => onUpdateSetting('colorBlindMode', option.value as AccessibilitySettings['colorBlindMode'])}
                        className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                          settings.colorBlindMode === option.value
                            ? 'bg-emerald-500 text-white'
                            : isDarkMode
                              ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <div className="text-left">
                          <div>{option.label}</div>
                          <div className={`text-xs ${
                            settings.colorBlindMode === option.value
                              ? 'text-white/70'
                              : isDarkMode ? 'text-slate-500' : 'text-gray-400'
                          }`}>
                            {option.description}
                          </div>
                        </div>
                        {settings.colorBlindMode === option.value && (
                          <span>✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              {/* Leitor de Tela */}
              <section>
                <h3 className={`text-sm font-semibold uppercase tracking-wider mb-3 ${
                  isDarkMode ? 'text-slate-500' : 'text-gray-400'
                }`}>
                  Leitor de Tela
                </h3>
                <div className={`rounded-xl border ${
                  isDarkMode ? 'border-slate-700' : 'border-gray-200'
                }`}>
                  <div className="px-4 py-3">
                    <Toggle
                      label="Otimizado para leitor de tela"
                      description="Melhora compatibilidade com NVDA, JAWS, VoiceOver"
                      checked={settings.screenReaderOptimized}
                      onChange={() => onUpdateSetting('screenReaderOptimized', !settings.screenReaderOptimized)}
                    />
                  </div>
                </div>
              </section>

              {/* Teclado */}
              <section>
                <h3 className={`text-sm font-semibold uppercase tracking-wider mb-3 ${
                  isDarkMode ? 'text-slate-500' : 'text-gray-400'
                }`}>
                  Navegação
                </h3>
                <div className={`rounded-xl border ${
                  isDarkMode ? 'border-slate-700' : 'border-gray-200'
                }`}>
                  <div className="px-4 py-3">
                    <Toggle
                      label="Apenas teclado"
                      description="Oculta elementos que requerem mouse"
                      checked={settings.keyboardOnly}
                      onChange={() => onUpdateSetting('keyboardOnly', !settings.keyboardOnly)}
                    />
                  </div>
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className={`p-4 border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
              <button
                onClick={onReset}
                className={`w-full py-2 rounded-lg border text-sm font-medium transition-colors ${
                  isDarkMode
                    ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Restaurar padrões
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

AccessibilityPanel.displayName = 'AccessibilityPanel';
