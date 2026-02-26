import React, { useState, useEffect, useCallback, useRef, lazy, Suspense, memo, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';

// Hooks otimizados
import { useOffline, useToast, useCache, useDebounce } from '../hooks';

// Novos hooks de features
import { 
  useAgents, 
  useOfflineQueue, 
  useCustomTheme, 
  useAdvancedKeyboard,
  useAudit,
  useSessionSharing,
  useTemplates,
  useWorkflows,
  useScheduler,
  useAccessibility,
} from '../hooks';

// Contexts
import { useAuth } from '../contexts/AuthContext';
import { useMode } from '../contexts/ModeContext';
import { useCRM } from '../contexts/CRMContext';

// Services
import { sendMessageToGemini, generateConsolidatedDossier, resetChatSession } from '../services/geminiService';

// Utils
import { normalizeAppError } from '../utils/errorHelpers';
import { downloadFile } from '../utils/downloadHelpers';
import { cleanStatusMarkers, cleanTitle, extractCompanyName } from '../utils/textCleaners';
import { validateMessage, checkRateLimit } from '../utils/validation';

// Types
import type { Message, Sender, Feedback, ChatSession, ExportFormat, ReportType, SessionId, MessageId } from '../types';
import { createSessionId, createMessageId } from '../types';

// Componentes UI
import { 
  ToastContainer, 
  LoadingSpinner, 
  ErrorBoundary,
  AgentSelector,
  AgentBadge,
  KeyboardCheatSheet,
  TemplatePanel,
  AccessibilityPanel,
  SchedulerPanel,
  ThemeCustomizer,
  WorkflowPanel,
} from './ui';

// Lazy loading
const ChatInterface = lazy(() => import('./ChatInterface'));
const CRMPipeline = lazy(() => import('./CRMPipeline'));
const AuthModal = lazy(() => import('./AuthModal'));

const SESSIONS_STORAGE_KEY = 'scout360_sessions_v1';
const PAGE_SIZE = 20;

// ===================================================================
// APP CORE COM TODAS AS FEATURES
// ===================================================================
const AppCore: React.FC = () => {
  const { userId, user, logout } = useAuth();
  const { mode, systemInstruction } = useMode();
  const { cards, createCardFromSession, createManualCard, moveCardToStage } = useCRM();
  const { isOnline, wasOffline, clearWasOffline } = useOffline();
  const { toasts, toast, dismiss: dismissToast } = useToast();

  // NOVAS FEATURES - Hooks
  const agents = useAgents();
  const offlineQueue = useOfflineQueue();
  const customTheme = useCustomTheme();
  const audit = useAudit(userId || undefined);
  const sessionSharing = useSessionSharing(userId || undefined);
  const templates = useTemplates();
  const workflows = useWorkflows();
  const scheduler = useScheduler();
  const accessibility = useAccessibility();

  // Estados principais
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<SessionId | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<string>('Iniciando análise');
  const [completedLoadingStatuses, setCompletedLoadingStatuses] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState<'chat' | 'crm'>('chat');

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastStatusRef = useRef<string | null>(null);

  // Memos
  const currentSession = useMemo(() => sessions.find(s => s.id === currentSessionId) || null, [sessions, currentSessionId]);
  const allMessages = useMemo(() => currentSession ? currentSession.messages : [], [currentSession]);

  // Keyboard shortcuts
  const keyboardActions = useMemo(() => ({
    'new-session': () => handleNewSession(),
    'toggle-sidebar': () => setIsSidebarOpen(prev => !prev),
    'toggle-theme': () => customTheme.toggleThemePanel(),
    'focus-input': () => document.getElementById('chat-input')?.focus(),
    'search-sessions': () => toast.info('Busca em breve'),
    'export-md': () => toast.info('Export em breve'),
    'clear-chat': () => handleClearChat(),
    'toggle-agent': () => agents.toggleAgentPanel(),
    'open-templates': () => templates.toggleTemplatePanel(),
    'open-workflows': () => workflows.toggleWorkflowPanel(),
  }), [agents, customTheme, templates, workflows, toast]);

  const keyboard = useAdvancedKeyboard(keyboardActions);

  // Inicialização
  useEffect(() => {
    const init = async () => {
      try {
        const saved = localStorage.getItem(SESSIONS_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setSessions(parsed.map((s: ChatSession) => ({
            ...s,
            messages: s.messages.map((m: Message) => ({
              ...m,
              timestamp: new Date(m.timestamp),
            })),
          })));
          if (parsed.length > 0) setCurrentSessionId(parsed[0].id);
        } else {
          handleNewSession();
        }
      } catch {
        handleNewSession();
      } finally {
        setIsInitialized(true);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
    }
  }, [sessions, isInitialized]);

  // Handlers
  const handleNewSession = useCallback(() => {
    abortControllerRef.current?.abort();
    const newSession: ChatSession = {
      id: createSessionId(uuidv4()),
      title: 'Nova Investigação',
      empresaAlvo: null,
      cnpj: null,
      modoPrincipal: null,
      scoreOportunidade: null,
      resumoDossie: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setVisibleCount(PAGE_SIZE);
    resetChatSession();
    audit.logSessionCreated(newSession.id, newSession.title);
  }, [audit]);

  const updateSessionById = useCallback((sessionId: SessionId, updater: (s: ChatSession) => ChatSession) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...updater(s), updatedAt: new Date().toISOString() } : s));
  }, []);

  const processMessage = useCallback(async (text: string, explicitSessionId?: SessionId, explicitHistory?: Message[]) => {
    const sessionId = explicitSessionId || currentSessionId;
    if (!sessionId) return;

    const validation = validateMessage(text);
    if (!validation.success) {
      toast.error(validation.errors?.[0] || 'Mensagem inválida');
      return;
    }

    const rateLimit = checkRateLimit(`msg-${userId || 'anon'}`, 30, 60000);
    if (!rateLimit.allowed) {
      toast.error('Muitas mensagens. Aguarde.');
      return;
    }

    setIsLoading(true);
    setLoadingStatus('Realizando pesquisa...');
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const historyToPass = explicitHistory || sessions.find(s => s.id === sessionId)?.messages || [];
    const botMessageId = createMessageId(uuidv4());

    setSessions(prev => prev.map(s => s.id === sessionId ? {
      ...s,
      messages: [...s.messages, { id: botMessageId, sender: Sender.Bot, text: '', timestamp: new Date(), isThinking: true }],
    } : s));

    try {
      const { text: responseText, sources, suggestions, scorePorta } = await sendMessageToGemini(
        text,
        historyToPass,
        agents.getAgentSystemPrompt(systemInstruction),
        { signal, onStatus: (status) => {
          setLoadingStatus(status);
          if (lastStatusRef.current && lastStatusRef.current !== status) {
            setCompletedLoadingStatuses(prev => [...prev, lastStatusRef.current!]);
          }
          lastStatusRef.current = status;
        }, nomeVendedor: user?.displayName || 'Vendedor' }
      );

      const companyName = extractCompanyName(text);
      updateSessionById(sessionId, s => ({
        ...s,
        title: s.messages.length <= 2 ? cleanTitle(companyName) : s.title,
        empresaAlvo: s.messages.length <= 2 ? companyName : s.empresaAlvo,
        messages: s.messages.map(m => m.id === botMessageId ? {
          ...m, text: responseText, groundingSources: sources, suggestions, scorePorta: scorePorta || undefined, isThinking: false
        } : m),
      }));

      audit.logMessageReceived(sessionId, responseText.length);
      workflows.triggerWorkflow('on_message', { sessionId, messageLength: text.length });
      toast.success('Análise concluída!');

    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, messages: s.messages.filter(m => m.id !== botMessageId) } : s));
        return;
      }
      const appError = normalizeAppError(error);
      updateSessionById(sessionId, s => ({
        ...s,
        messages: [...s.messages.filter(m => m.id !== botMessageId), {
          id: createMessageId(uuidv4()), sender: Sender.Bot, text: 'Erro no processamento',
          timestamp: new Date(), isError: true, errorDetails: appError,
        }],
      }));
      toast.error(appError.friendlyMessage);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [currentSessionId, sessions, systemInstruction, agents, user, audit, workflows, toast, updateSessionById]);

  const handleSendMessage = useCallback(async (text: string, displayText?: string) => {
    let sessionId = currentSessionId;
    if (!sessionId) {
      sessionId = createSessionId(uuidv4());
      const title = cleanTitle(extractCompanyName(displayText || text));
      const newSession: ChatSession = { id: sessionId, title: title || 'Nova Investigação', empresaAlvo: title || null, cnpj: null, modoPrincipal: null, scoreOportunidade: null, resumoDossie: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), messages: [] };
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(sessionId);
    }

    const userMessage: Message = { id: createMessageId(uuidv4()), sender: Sender.User, text: displayText || text, timestamp: new Date() };
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, messages: [...s.messages, userMessage] } : s));
    
    audit.logMessageSent(sessionId, text.length);
    await processMessage(text, sessionId);
  }, [currentSessionId, processMessage, audit]);

  const handleClearChat = useCallback(() => {
    if (!window.confirm('Limpar todas as mensagens?')) return;
    if (currentSessionId) {
      updateSessionById(currentSessionId, s => ({ ...s, messages: [], title: 'Nova Investigação', empresaAlvo: null }));
    }
  }, [currentSessionId, updateSessionById]);

  const handleDeleteSession = useCallback((sessionId: SessionId) => {
    abortControllerRef.current?.abort();
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== sessionId);
      if (currentSessionId === sessionId) {
        setCurrentSessionId(filtered[0]?.id || null);
        if (filtered.length === 0) handleNewSession();
      }
      return filtered;
    });
    audit.logSessionDeleted(sessionId);
  }, [currentSessionId, audit, handleNewSession]);

  const handleExportConversation = useCallback(async (format: ExportFormat, reportType: ReportType) => {
    if (!currentSession) return;
    try {
      const content = await generateConsolidatedDossier(currentSession.messages, systemInstruction, mode, reportType);
      const filename = `SeniorScout_${cleanTitle(currentSession.title).replace(/[^a-z0-9]/gi, '_')}_${reportType}_${new Date().toISOString().slice(0, 10)}`;
      if (format === 'md') downloadFile(`${filename}.md`, content, 'text/markdown;charset=utf-8');
      audit.logSessionExported(currentSession.id, format);
      toast.success('Exportado!');
    } catch {
      toast.error('Erro na exportação');
    }
  }, [currentSession, systemInstruction, mode, audit, toast]);

  const handleSaveToCRM = useCallback(async (sessionId: SessionId) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;
    try {
      const card = await createCardFromSession(session);
      audit.logCRMCardCreated(card.id, card.companyName);
      toast.success('Adicionado ao CRM!');
    } catch {
      toast.error('Erro ao adicionar');
    }
  }, [sessions, createCardFromSession, audit, toast]);

  // Render
  if (!isInitialized) {
    return (
      <div className={`flex h-screen w-full items-center justify-center ${customTheme.isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <LoadingSpinner size="lg" isDarkMode={customTheme.isDarkMode} />
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-screen w-full ${customTheme.isDarkMode ? 'bg-slate-950' : 'bg-slate-50'} ${accessibility.cssClasses}`}>
      {/* Skip Link */}
      <a href="#main-content" className="skip-link">Pular para conteúdo principal</a>

      {/* Screen Reader Announcer */}
      <div id="sr-announcer" aria-live="polite" aria-atomic="true" />

      {/* Toast */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} position="top-right" />

      {/* Offline Banner */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-0 inset-x-0 z-[100] flex items-center justify-center gap-2 bg-amber-500 text-amber-950 text-xs font-semibold py-1.5 px-4 shadow-lg">
            <span>📡</span> Sem conexão — funções offline ativas
          </motion.div>
        )}
        {isOnline && wasOffline && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-0 inset-x-0 z-[100] flex items-center justify-center gap-2 bg-emerald-600 text-white text-xs font-semibold py-1.5 px-4 shadow-lg cursor-pointer"
            onClick={clearWasOffline}>
            <span>✓</span> Conexão restabelecida
          </motion.div>
        )}
      </AnimatePresence>

      {/* Agent Badge */}
      <div className="fixed top-4 left-4 z-40">
        <AgentBadge agent={agents.selectedAgent} onClick={agents.toggleAgentPanel} isDarkMode={customTheme.isDarkMode} />
      </div>

      {/* Feature Panels */}
      <AgentSelector
        selectedAgentId={agents.selectedAgentId}
        onSelectAgent={(id) => { agents.selectAgent(id); audit.logAgentChanged(id, agents.availableAgents.find(a => a.id === id)?.name || ''); }}
        isOpen={agents.isAgentPanelOpen}
        onClose={() => agents.setIsAgentPanelOpen(false)}
        isDarkMode={customTheme.isDarkMode}
      />

      <KeyboardCheatSheet
        isOpen={keyboard.isCheatSheetOpen}
        onClose={keyboard.closeCheatSheet}
        shortcuts={keyboard.shortcuts}
        formatShortcut={keyboard.formatShortcut}
        isDarkMode={customTheme.isDarkMode}
        onMarkSeen={keyboard.markCheatSheetSeen}
      />

      <TemplatePanel
        isOpen={templates.isTemplatePanelOpen}
        onClose={() => templates.setIsTemplatePanelOpen(false)}
        templates={templates.templates}
        templatesByCategory={templates.templatesByCategory}
        onUseTemplate={(id) => { 
          const prompt = templates.useTemplate(id); 
          if (prompt) handleSendMessage(prompt);
          audit.logTemplateUsed(id, templates.getTemplate(id)?.name || '');
        }}
        onCreateTemplate={(name, desc, cat, prompts) => templates.createTemplate(name, desc, cat, prompts)}
        getCategoryLabel={templates.getCategoryLabel}
        isDarkMode={customTheme.isDarkMode}
      />

      <ThemeCustomizer
        isOpen={customTheme.isThemePanelOpen}
        onClose={() => customTheme.setIsThemePanelOpen(false)}
        themes={customTheme.themes}
        activeTheme={customTheme.activeTheme}
        customThemes={customTheme.customThemes}
        onSetTheme={(id) => { customTheme.setTheme(id); audit.logThemeChanged(id, customTheme.themes.find(t => t.id === id)?.name || ''); }}
        onCreateTheme={customTheme.createTheme}
        onDeleteTheme={customTheme.deleteTheme}
        onDuplicateTheme={customTheme.duplicateTheme}
        isDarkMode={customTheme.isDarkMode}
      />

      <AccessibilityPanel
        isOpen={accessibility.isPanelOpen}
        onClose={() => accessibility.setIsPanelOpen(false)}
        settings={accessibility.settings}
        onUpdateSetting={accessibility.updateSetting}
        onReset={accessibility.resetSettings}
        isDarkMode={customTheme.isDarkMode}
      />

      <SchedulerPanel
        isOpen={scheduler.isSchedulerOpen}
        onClose={scheduler.toggleScheduler}
        tasks={scheduler.tasks}
        upcomingTasks={scheduler.upcomingTasks}
        overdueTasks={scheduler.overdueTasks}
        completedTasks={scheduler.completedTasks}
        onScheduleTask={scheduler.scheduleTask}
        onCompleteTask={scheduler.completeTask}
        onDeleteTask={scheduler.deleteTask}
        onSnoozeTask={scheduler.snoozeTask}
        onEnableNotifications={scheduler.enableNotifications}
        notificationsEnabled={scheduler.notificationsEnabled}
        formatScheduledTime={scheduler.formatScheduledTime}
        isDarkMode={customTheme.isDarkMode}
      />

      <WorkflowPanel
        isOpen={workflows.isWorkflowPanelOpen}
        onClose={workflows.toggleWorkflowPanel}
        workflows={workflows.workflows}
        activeWorkflows={workflows.activeWorkflows}
        onCreateWorkflow={workflows.createWorkflow}
        onToggleWorkflow={workflows.toggleWorkflow}
        onDeleteWorkflow={workflows.deleteWorkflow}
        isDarkMode={customTheme.isDarkMode}
      />

      {/* Main Content */}
      <main id="main-content" className="flex-1 h-full outline-none" tabIndex={-1}>
        <AnimatePresence mode="wait">
          {activeView === 'chat' ? (
            <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 h-full">
              <Suspense fallback={<LoadingSpinner isDarkMode={customTheme.isDarkMode} />}>
                <ErrorBoundary componentName="ChatInterface">
                  <ChatInterface
                    currentSession={currentSession}
                    sessions={sessions}
                    onNewSession={handleNewSession}
                    onSelectSession={(id) => setCurrentSessionId(id)}
                    onDeleteSession={handleDeleteSession}
                    onSaveToCRM={handleSaveToCRM}
                    onOpenKanban={() => setActiveView('crm')}
                    isSidebarOpen={isSidebarOpen}
                    onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                    messages={allMessages.slice(-visibleCount)}
                    isLoading={isLoading}
                    hasMore={allMessages.length > visibleCount}
                    onSendMessage={handleSendMessage}
                    onFeedback={(id, fb) => updateSessionById(currentSessionId!, s => ({ ...s, messages: s.messages.map(m => m.id === id ? { ...m, feedback: fb } : m) }))}
                    onLoadMore={() => setVisibleCount(p => p + PAGE_SIZE)}
                    onExportConversation={handleExportConversation}
                    onClearChat={handleClearChat}
                    onStop={() => abortControllerRef.current?.abort()}
                    isDarkMode={customTheme.isDarkMode}
                    onToggleTheme={customTheme.toggleThemePanel}
                    onToggleMessageSources={(id) => updateSessionById(currentSessionId!, s => ({ ...s, messages: s.messages.map(m => m.id === id ? { ...m, isSourcesOpen: !m.isSourcesOpen } : m) }))}
                    processing={{ stage: loadingStatus, completedStages: completedLoadingStatuses }}
                  />
                </ErrorBoundary>
              </Suspense>
            </motion.div>
          ) : (
            <motion.div key="crm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 h-full">
              <Suspense fallback={<LoadingSpinner isDarkMode={customTheme.isDarkMode} />}>
                <ErrorBoundary componentName="CRM">
                  <div className={`flex h-full w-full ${customTheme.isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
                    <div className="flex-1 p-4 md:p-6 overflow-y-auto">
                      <div className="flex items-center justify-between mb-4">
                        <h1 className={`text-lg font-semibold ${customTheme.isDarkMode ? 'text-white' : 'text-gray-900'}`}>Mini CRM</h1>
                        <button onClick={() => setActiveView('chat')} className="px-3 py-1.5 rounded-lg border text-sm">← Voltar</button>
                      </div>
                      <CRMPipeline cards={cards} onMoveCard={(id, stage) => { moveCardToStage(id, stage); audit.logCRMCardMoved(id, '', stage); }} onSelectCard={() => {}} />
                    </div>
                  </div>
                </ErrorBoundary>
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Toolbar */}
      <div className={`fixed bottom-4 right-4 flex gap-2 z-40`}>
        <button onClick={keyboard.openCheatSheet} className={`p-2 rounded-full shadow-lg ${customTheme.isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-gray-700'}`} title="Atalhos (?)">⌨️</button>
        <button onClick={templates.toggleTemplatePanel} className={`p-2 rounded-full shadow-lg ${customTheme.isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-gray-700'}`} title="Templates">📋</button>
        <button onClick={scheduler.toggleScheduler} className={`p-2 rounded-full shadow-lg ${customTheme.isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-gray-700'}`} title="Agendamentos">📅</button>
        <button onClick={workflows.toggleWorkflowPanel} className={`p-2 rounded-full shadow-lg ${customTheme.isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-gray-700'}`} title="Workflows">⚙️</button>
        <button onClick={accessibility.togglePanel} className={`p-2 rounded-full shadow-lg ${customTheme.isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-gray-700'}`} title="Acessibilidade">♿</button>
      </div>
    </div>
  );
};

export default memo(AppCore);
