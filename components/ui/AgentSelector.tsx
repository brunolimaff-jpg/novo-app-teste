import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Agent } from '../../types/features';
import { AGENTS } from '../../types/features';

interface AgentSelectorProps {
  selectedAgentId: string;
  onSelectAgent: (agentId: string) => void;
  isOpen: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
}

export const AgentSelector: React.FC<AgentSelectorProps> = memo(({
  selectedAgentId,
  onSelectAgent,
  isOpen,
  onClose,
  isDarkMode = false,
}) => {
  const selectedAgent = AGENTS.find(a => a.id === selectedAgentId) || AGENTS[0];

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
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className={`fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-md z-50 rounded-xl shadow-2xl overflow-hidden ${
              isDarkMode ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-gray-200'
            }`}
          >
            <div className={`p-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Selecionar Agente
                </h2>
                <button
                  onClick={onClose}
                  className={`p-1 rounded-lg transition-colors ${
                    isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-gray-100 text-gray-500'
                  }`}
                  aria-label="Fechar"
                >
                  ✕
                </button>
              </div>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                Cada agente tem especialidades diferentes
              </p>
            </div>

            <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
              {AGENTS.filter(a => a.isActive).map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => {
                    onSelectAgent(agent.id);
                    onClose();
                  }}
                  className={`w-full p-4 rounded-xl text-left transition-all ${
                    selectedAgentId === agent.id
                      ? 'ring-2'
                      : 'hover:scale-[1.02]'
                  } ${
                    isDarkMode
                      ? selectedAgentId === agent.id
                        ? 'bg-slate-800 ring-emerald-500'
                        : 'bg-slate-800/50 hover:bg-slate-800'
                      : selectedAgentId === agent.id
                        ? 'bg-emerald-50 ring-emerald-500'
                        : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  style={selectedAgentId === agent.id ? { '--tw-ring-color': agent.color } as React.CSSProperties : {}}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{agent.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {agent.name}
                        </h3>
                        {selectedAgentId === agent.id && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                            Ativo
                          </span>
                        )}
                      </div>
                      <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                        {agent.description}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {agent.capabilities.map((cap, i) => (
                          <span
                            key={i}
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-200 text-gray-600'
                            }`}
                          >
                            {cap}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className={`p-4 border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
              <div className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                Atalho: <kbd className={`px-1.5 py-0.5 rounded ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`}>Ctrl + A</kbd>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

AgentSelector.displayName = 'AgentSelector';

interface AgentBadgeProps {
  agent: Agent;
  onClick?: () => void;
  isDarkMode?: boolean;
}

export const AgentBadge: React.FC<AgentBadgeProps> = memo(({
  agent,
  onClick,
  isDarkMode = false,
}) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all hover:scale-105 ${
        isDarkMode ? 'bg-slate-800 text-slate-200' : 'bg-white text-gray-700'
      } shadow-sm border ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}
      style={{ borderColor: agent.color }}
    >
      <span>{agent.icon}</span>
      <span>{agent.name}</span>
    </button>
  );
});

AgentBadge.displayName = 'AgentBadge';
