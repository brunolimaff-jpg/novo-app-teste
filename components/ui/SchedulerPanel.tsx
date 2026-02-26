import React, { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ScheduledTask } from '../../types/features';

interface SchedulerPanelProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: ScheduledTask[];
  upcomingTasks: ScheduledTask[];
  overdueTasks: ScheduledTask[];
  completedTasks: ScheduledTask[];
  onScheduleTask: (type: ScheduledTask['type'], title: string, scheduledAt: number, options?: object) => string;
  onCompleteTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onSnoozeTask: (taskId: string, minutes: number) => void;
  onEnableNotifications: () => Promise<boolean>;
  notificationsEnabled: boolean;
  formatScheduledTime: (timestamp: number) => string;
  isDarkMode?: boolean;
}

const taskTypeIcons: Record<ScheduledTask['type'], string> = {
  reminder: '⏰',
  follow_up: '🔄',
  report: '📊',
  sync: '🔄',
};

const taskTypeLabels: Record<ScheduledTask['type'], string> = {
  reminder: 'Lembrete',
  follow_up: 'Follow-up',
  report: 'Relatório',
  sync: 'Sincronização',
};

export const SchedulerPanel: React.FC<SchedulerPanelProps> = memo(({
  isOpen,
  onClose,
  upcomingTasks,
  overdueTasks,
  completedTasks,
  onScheduleTask,
  onCompleteTask,
  onDeleteTask,
  onSnoozeTask,
  onEnableNotifications,
  notificationsEnabled,
  formatScheduledTime,
  isDarkMode = false,
}) => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'overdue' | 'completed'>('upcoming');
  const [isCreating, setIsCreating] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    type: 'reminder' as ScheduledTask['type'],
    days: 1,
    description: '',
  });

  const handleCreate = () => {
    if (!newTask.title) return;
    
    const scheduledAt = Date.now() + (newTask.days * 24 * 60 * 60 * 1000);
    onScheduleTask(newTask.type, newTask.title, scheduledAt, {
      description: newTask.description,
    });
    
    setIsCreating(false);
    setNewTask({ title: '', type: 'reminder', days: 1, description: '' });
  };

  const getTasksForTab = () => {
    switch (activeTab) {
      case 'upcoming': return upcomingTasks;
      case 'overdue': return overdueTasks;
      case 'completed': return completedTasks;
      default: return [];
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
            <div className={`p-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Agendamentos
                  </h2>
                  <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    {upcomingTasks.length} próximos · {overdueTasks.length} atrasados
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

              {/* Notification Toggle */}
              {!notificationsEnabled && (
                <button
                  onClick={onEnableNotifications}
                  className="mt-3 w-full py-2 px-3 rounded-lg bg-amber-500/20 text-amber-600 text-sm flex items-center justify-center gap-2"
                >
                  <span>🔔</span>
                  Ativar notificações do navegador
                </button>
              )}
            </div>

            {/* Tabs */}
            <div className={`flex border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
              {[
                { id: 'upcoming', label: 'Próximos', count: upcomingTasks.length },
                { id: 'overdue', label: 'Atrasados', count: overdueTasks.length },
                { id: 'completed', label: 'Concluídos', count: completedTasks.length },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-emerald-500 border-b-2 border-emerald-500'
                      : isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                      activeTab === tab.id
                        ? 'bg-emerald-500 text-white'
                        : isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Create Button */}
            <div className="p-4">
              <button
                onClick={() => setIsCreating(true)}
                className="w-full py-2 rounded-lg border-2 border-dashed border-emerald-500 text-emerald-500 font-medium hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
              >
                + Novo agendamento
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {isCreating ? (
                <div className={`p-4 rounded-xl border ${isDarkMode ? 'border-slate-700 bg-slate-800/50' : 'border-gray-200 bg-gray-50'}`}>
                  <h3 className={`font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Novo Agendamento
                  </h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={newTask.title}
                      onChange={e => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Título"
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${
                        isDarkMode
                          ? 'bg-slate-900 border-slate-700 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                    <textarea
                      value={newTask.description}
                      onChange={e => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descrição (opcional)"
                      rows={2}
                      className={`w-full px-3 py-2 rounded-lg border text-sm resize-none ${
                        isDarkMode
                          ? 'bg-slate-900 border-slate-700 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                    <select
                      value={newTask.type}
                      onChange={e => setNewTask(prev => ({ ...prev, type: e.target.value as ScheduledTask['type'] }))}
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${
                        isDarkMode
                          ? 'bg-slate-900 border-slate-700 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      {Object.entries(taskTypeLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                        Em
                      </span>
                      <input
                        type="number"
                        value={newTask.days}
                        onChange={e => setNewTask(prev => ({ ...prev, days: parseInt(e.target.value) || 1 }))}
                        min={1}
                        max={365}
                        className={`w-20 px-3 py-2 rounded-lg border text-sm text-center ${
                          isDarkMode
                            ? 'bg-slate-900 border-slate-700 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                      <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                        dias
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCreate}
                        className="flex-1 py-2 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600"
                      >
                        Agendar
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
                getTasksForTab().map(task => (
                  <div
                    key={task.id}
                    className={`p-4 rounded-xl border ${
                      isDarkMode
                        ? 'border-slate-700 bg-slate-800/50'
                        : 'border-gray-200 bg-white'
                    } ${task.isCompleted ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{taskTypeIcons[task.type]}</span>
                      <div className="flex-1">
                        <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                            {task.description}
                          </p>
                        )}
                        <p className={`text-xs mt-2 ${
                          overdueTasks.includes(task)
                            ? 'text-red-500'
                            : isDarkMode ? 'text-slate-500' : 'text-gray-400'
                        }`}>
                          {formatScheduledTime(task.scheduledAt)}
                        </p>
                      </div>
                    </div>

                    {!task.isCompleted && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => onCompleteTask(task.id)}
                          className="flex-1 py-1.5 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600"
                        >
                          Concluir
                        </button>
                        <button
                          onClick={() => onSnoozeTask(task.id, 30)}
                          className={`px-3 py-1.5 rounded-lg text-sm ${
                            isDarkMode
                              ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          +30min
                        </button>
                        <button
                          onClick={() => onDeleteTask(task.id)}
                          className="px-3 py-1.5 rounded-lg text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}

              {!isCreating && getTasksForTab().length === 0 && (
                <div className={`text-center py-8 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                  <span className="text-4xl">📅</span>
                  <p className="mt-2">Nenhum agendamento</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

SchedulerPanel.displayName = 'SchedulerPanel';
