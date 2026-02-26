import React, { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { InvestigationTemplate } from '../../types/features';

interface TemplatePanelProps {
  isOpen: boolean;
  onClose: () => void;
  templates: InvestigationTemplate[];
  templatesByCategory: Record<string, InvestigationTemplate[]>;
  onUseTemplate: (templateId: string) => void;
  onCreateTemplate?: (name: string, description: string, category: InvestigationTemplate['category'], prompts: string[]) => void;
  getCategoryLabel: (category: string) => string;
  isDarkMode?: boolean;
}

const categoryIcons: Record<string, string> = {
  qualificação: '✅',
  dossiê: '📋',
  'follow-up': '🔄',
  proposta: '💼',
  custom: '⚙️',
};

export const TemplatePanel: React.FC<TemplatePanelProps> = memo(({
  isOpen,
  onClose,
  templates,
  templatesByCategory,
  onUseTemplate,
  onCreateTemplate,
  getCategoryLabel,
  isDarkMode = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    category: 'custom' as InvestigationTemplate['category'],
    prompts: [''],
  });

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Object.keys(templatesByCategory);

  const handleAddPrompt = () => {
    setNewTemplate(prev => ({
      ...prev,
      prompts: [...prev.prompts, ''],
    }));
  };

  const handlePromptChange = (index: number, value: string) => {
    setNewTemplate(prev => ({
      ...prev,
      prompts: prev.prompts.map((p, i) => i === index ? value : p),
    }));
  };

  const handleRemovePrompt = (index: number) => {
    setNewTemplate(prev => ({
      ...prev,
      prompts: prev.prompts.filter((_, i) => i !== index),
    }));
  };

  const handleCreate = () => {
    if (onCreateTemplate && newTemplate.name && newTemplate.prompts.some(p => p.trim())) {
      onCreateTemplate(
        newTemplate.name,
        newTemplate.description,
        newTemplate.category,
        newTemplate.prompts.filter(p => p.trim())
      );
      setIsCreating(false);
      setNewTemplate({ name: '', description: '', category: 'custom', prompts: [''] });
    }
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
            <div className={`p-4 border-b flex items-center justify-between ${
              isDarkMode ? 'border-slate-700' : 'border-gray-200'
            }`}>
              <div>
                <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Templates de Investigação
                </h2>
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                  {templates.length} templates disponíveis
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

            {/* Search and Filter */}
            <div className={`p-4 border-b space-y-3 ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar templates..."
                className={`w-full px-4 py-2 rounded-lg border text-sm ${
                  isDarkMode
                    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                }`}
              />
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-3 py-1 rounded-full text-xs transition-colors ${
                    selectedCategory === null
                      ? 'bg-emerald-500 text-white'
                      : isDarkMode
                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Todos
                </button>
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1 rounded-full text-xs transition-colors ${
                      selectedCategory === category
                        ? 'bg-emerald-500 text-white'
                        : isDarkMode
                          ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {categoryIcons[category]} {getCategoryLabel(category)}
                  </button>
                ))}
              </div>
            </div>

            {/* Create Button */}
            {onCreateCreate && (
              <div className="p-4">
                <button
                  onClick={() => setIsCreating(true)}
                  className="w-full py-2 rounded-lg border-2 border-dashed border-emerald-500 text-emerald-500 font-medium hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                >
                  + Criar novo template
                </button>
              </div>
            )}

            {/* Templates List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {isCreating ? (
                <div className={`p-4 rounded-xl border ${isDarkMode ? 'border-slate-700 bg-slate-800/50' : 'border-gray-200 bg-gray-50'}`}>
                  <h3 className={`font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Novo Template
                  </h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={newTemplate.name}
                      onChange={e => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nome do template"
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${
                        isDarkMode
                          ? 'bg-slate-900 border-slate-700 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                    <input
                      type="text"
                      value={newTemplate.description}
                      onChange={e => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descrição"
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${
                        isDarkMode
                          ? 'bg-slate-900 border-slate-700 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                    <select
                      value={newTemplate.category}
                      onChange={e => setNewTemplate(prev => ({ ...prev, category: e.target.value as InvestigationTemplate['category'] }))}
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${
                        isDarkMode
                          ? 'bg-slate-900 border-slate-700 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="qualificação">Qualificação</option>
                      <option value="dossiê">Dossiê</option>
                      <option value="follow-up">Follow-up</option>
                      <option value="proposta">Proposta</option>
                      <option value="custom">Personalizado</option>
                    </select>
                    <div className="space-y-2">
                      {newTemplate.prompts.map((prompt, i) => (
                        <div key={i} className="flex gap-2">
                          <textarea
                            value={prompt}
                            onChange={e => handlePromptChange(i, e.target.value)}
                            placeholder={`Prompt ${i + 1}`}
                            rows={2}
                            className={`flex-1 px-3 py-2 rounded-lg border text-sm resize-none ${
                              isDarkMode
                                ? 'bg-slate-900 border-slate-700 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          />
                          {newTemplate.prompts.length > 1 && (
                            <button
                              onClick={() => handleRemovePrompt(i)}
                              className="px-2 py-1 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={handleAddPrompt}
                        className="text-sm text-emerald-500 hover:text-emerald-600"
                      >
                        + Adicionar prompt
                      </button>
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
                filteredTemplates.map(template => (
                  <div
                    key={template.id}
                    className={`p-4 rounded-xl border transition-all hover:shadow-md ${
                      isDarkMode
                        ? 'border-slate-700 bg-slate-800/50 hover:bg-slate-800'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{categoryIcons[template.category]}</span>
                          <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {template.name}
                          </h3>
                          {template.isDefault && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-200 text-gray-600'
                            }`}>
                              Padrão
                            </span>
                          )}
                        </div>
                        <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                          {template.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs">
                          <span className={isDarkMode ? 'text-slate-500' : 'text-gray-400'}>
                            {template.prompts.length} prompts
                          </span>
                          {template.usageCount > 0 && (
                            <span className={isDarkMode ? 'text-slate-500' : 'text-gray-400'}>
                              Usado {template.usageCount}x
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          onUseTemplate(template.id);
                          onClose();
                        }}
                        className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors"
                      >
                        Usar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className={`p-4 border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
              <div className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                Atalho: <kbd className={`px-1.5 py-0.5 rounded ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`}>Ctrl + T</kbd>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

TemplatePanel.displayName = 'TemplatePanel';
