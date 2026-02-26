import React, { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Workflow, WorkflowTrigger, WorkflowAction } from '../../types/features';

interface WorkflowPanelProps {
  isOpen: boolean;
  onClose: () => void;
  workflows: Workflow[];
  activeWorkflows: Workflow[];
  onCreateWorkflow: (name: string, description: string, trigger: WorkflowTrigger, conditions: Workflow['conditions'], actions: Workflow['actions']) => string;
  onToggleWorkflow: (workflowId: string) => void;
  onDeleteWorkflow: (workflowId: string) => void;
  isDarkMode?: boolean;
}

const triggerLabels: Record<WorkflowTrigger, string> = {
  on_message: 'Ao enviar mensagem',
  on_export: 'Ao exportar',
  on_crm_move: 'Ao mover card no CRM',
  scheduled: 'Agendado',
  manual: 'Manual',
};

const actionLabels: Record<WorkflowAction, string> = {
  send_reminder: 'Enviar lembrete',
  create_task: 'Criar tarefa',
  export_data: 'Exportar dados',
  notify: 'Notificação',
  webhook: 'Webhook',
};

export const WorkflowPanel: React.FC<WorkflowPanelProps> = memo(({
  isOpen,
  onClose,
  workflows,
  activeWorkflows,
  onCreateWorkflow,
  onToggleWorkflow,
  onDeleteWorkflow,
  isDarkMode = false,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    description: '',
    trigger: 'manual' as WorkflowTrigger,
    actions: [] as WorkflowAction[],
  });

  const handleCreate = () => {
    if (newWorkflow.name && newWorkflow.actions.length > 0) {
      onCreateWorkflow(
        newWorkflow.name,
        newWorkflow.description,
        newWorkflow.trigger,
        [],
        newWorkflow.actions.map(type => ({ type, config: {} }))
      );
      setIsCreating(false);
      setNewWorkflow({ name: '', description: '', trigger: 'manual', actions: [] });
    }
  };

  const toggleAction = (action: WorkflowAction) => {
    setNewWorkflow(prev => ({
      ...prev,
      actions: prev.actions.includes(action)
        ? prev.actions.filter(a => a !== action)
        : [...prev.actions, action],
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
                    Workflows
                  </h2>
                  <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    {activeWorkflows.length} ativos de {workflows.length} total
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
                + Novo workflow
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {isCreating ? (
                <div className={`p-4 rounded-xl border ${isDarkMode ? 'border-slate-700 bg-slate-800/50' : 'border-gray-200 bg-gray-50'}`}>
                  <h3 className={`font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Novo Workflow
                  </h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={newWorkflow.name}
                      onChange={e => setNewWorkflow(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nome do workflow"
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${
                        isDarkMode
                          ? 'bg-slate-900 border-slate-700 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                    <input
                      type="text"
                      value={newWorkflow.description}
                      onChange={e => setNewWorkflow(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descrição"
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${
                        isDarkMode
                          ? 'bg-slate-900 border-slate-700 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                    <select
                      value={newWorkflow.trigger}
                      onChange={e => setNewWorkflow(prev => ({ ...prev, trigger: e.target.value as WorkflowTrigger }))}
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${
                        isDarkMode
                          ? 'bg-slate-900 border-slate-700 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      {Object.entries(triggerLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                    <div>
                      <p className={`text-sm mb-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                        Ações:
                      </p>
                      <div className="space-y-2">
                        {Object.entries(actionLabels).map(([value, label]) => (
                          <button
                            key={value}
                            onClick={() => toggleAction(value as WorkflowAction)}
                            className={`w-full flex items-center justify-between p-2 rounded-lg text-sm transition-colors ${
                              newWorkflow.actions.includes(value as WorkflowAction)
                                ? 'bg-emerald-500 text-white'
                                : isDarkMode
                                  ? 'bg-slate-800 text-slate-300'
                                  : 'bg-white text-gray-700 border border-gray-200'
                            }`}
                          >
                            <span>{label}</span>
                            {newWorkflow.actions.includes(value as WorkflowAction) && <span>✓</span>}
                          </button>
                        ))}
                      </div>
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
                workflows.map(workflow => (
                  <div
                    key={workflow.id}
                    className={`p-4 rounded-xl border ${
                      isDarkMode
                        ? 'border-slate-700 bg-slate-800/50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {workflow.name}
                          </h4>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            workflow.isActive
                              ? 'bg-emerald-500/20 text-emerald-500'
                              : isDarkMode ? 'bg-slate-700 text-slate-400' : 'bg-gray-200 text-gray-500'
                          }`}>
                            {workflow.isActive ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                        <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                          {workflow.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs">
                          <span className={isDarkMode ? 'text-slate-500' : 'text-gray-400'}>
                            {triggerLabels[workflow.trigger]}
                          </span>
                          <span className={isDarkMode ? 'text-slate-500' : 'text-gray-400'}>
                            {workflow.runCount} execuções
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => onToggleWorkflow(workflow.id)}
                        className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          workflow.isActive
                            ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                            : isDarkMode
                              ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {workflow.isActive ? 'Desativar' : 'Ativar'}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Tem certeza que deseja excluir este workflow?')) {
                            onDeleteWorkflow(workflow.id);
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}

              {!isCreating && workflows.length === 0 && (
                <div className={`text-center py-8 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                  <span className="text-4xl">⚙️</span>
                  <p className="mt-2">Nenhum workflow criado</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

WorkflowPanel.displayName = 'WorkflowPanel';
