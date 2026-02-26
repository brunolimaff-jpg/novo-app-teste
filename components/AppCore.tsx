import React, { 
  useState, 
  useEffect, 
  useCallback, 
  useRef, 
  lazy, 
  Suspense, 
  memo,
  useMemo,
} from 'react';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';

// Hooks otimizados
import { useOffline } from '../hooks/useOffline';
import { useToast } from '../hooks/useToast';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useCache } from '../hooks/useCache';
import { useDebounce } from '../hooks/useDebounce';

// Contexts
import { useAuth } from '../contexts/AuthContext';
import { useMode } from '../contexts/ModeContext';
import { useCRM } from '../contexts/CRMContext';

// Services
import { 
  sendMessageToGemini, 
  generateNewSuggestions, 
  generateConsolidatedDossier,
  resetChatSession,
} from '../services/geminiService';

// Utils
import { normalizeAppError } from '../utils/errorHelpers';
import { downloadFile } from '../utils/downloadHelpers';
import { cleanStatusMarkers, cleanTitle, extractCompanyName } from '../utils/textCleaners';
import { validateMessage, checkRateLimit } from '../utils/validation';

// Types
import type { 
  Message, 
  Sender, 
  Feedback, 
  ChatSession, 
  ExportFormat, 
  ReportType, 
  AppError, 
  CRMStage,
  SessionId,
  MessageId,
} from '../types';
import { createSessionId, createMessageId } from '../types';

// Componentes UI
import { ToastContainer } from './ui/ToastContainer';
import { LoadingSpinner } from './ui/LoadingState';
import { SkeletonSidebar } from './ui/Skeleton';
import { ErrorBoundary } from './ui/ErrorBoundary';

// Lazy loading de componentes pesados
const ChatInterface = lazy(() => import('./ChatInterface'));
const CRMPipeline = lazy(() => import('./CRMPipeline'));
const CRMDetail = lazy(() => import('./CRMDetail'));
const PDFGenerator = lazy(() => import('../utils/PDFGenerator'));
const WarRoom = lazy(() => import('./WarRoom'));
const AuthModal = lazy(() => import('./AuthModal'));

// Constants
const SESSIONS_STORAGE_KEY = 'scout360_sessions_v1';
const THEME_KEY = 'scout360_theme';
const PAGE_SIZE = 20;
const MAX_MESSAGE_LENGTH = 5000;

interface LastAction {
  type: 'sendMessage' | 'regenerateSuggestions';
  payload: Record<string, unknown>;
}

// ===================================================================
// COMPONENTE PRINCIPAL
// ===================================================================
const AppCore: React.FC = () => {
  // Contexts
  const { userId, user, logout, isAuthenticated } = useAuth();
  const { mode, systemInstruction } = useMode();
  const { cards, createCardFromSession, createManualCard, moveCardToStage } = useCRM();
  const { isOnline, wasOffline, clearWasOffline } = useOffline();
  const { toasts, toast, dismiss: dismissToast } = useToast();

  // Cache para otimização
  const sessionCache = useCache<ChatSession>(10 * 60 * 1000);

  // Estados
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<SessionId | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<string>('Iniciando análise');
  const [completedLoadingStatuses, setCompletedLoadingStatuses] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(THEME_KEY) === 'dark';
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [lastQuery, setLastQuery] = useState<string>('');
  const [isSavingRemote, setIsSavingRemote] = useState(false);
  const [remoteSaveStatus, setRemoteSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [exportStatus, setExportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [exportError, setExportError] = useState<string | null>(null);
  const [investigationLogged, setInvestigationLogged] = useState(false);
  const [activeView, setActiveView] = useState<'chat' | 'crm'>('chat');
  const [selectedCRMCardId, setSelectedCRMCardId] = useState<string | null>(null);

  // Modais
  const [showNewCrmForm, setShowNewCrmForm] = useState(false);
  const [newCrmName, setNewCrmName] = useState('');
  const [newCrmWebsite, setNewCrmWebsite] = useState('');
  const [newCrmResumo, setNewCrmResumo] = useState('');
  const [isCreatingCrmCard, setIsCreatingCrmCard] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailStatus, setEmailStatus] = useState<'sending' | 'sent' | 'error' | null>(null);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpDias, setFollowUpDias] = useState(7);
  const [followUpNotas, setFollowUpNotas] = useState('');
  const [followUpStatus, setFollowUpStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  // Refs
  const lastActionRef = useRef<LastAction | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastStatusRef = useRef<string | null>(null);
  const activeGenerationRef = useRef<Record<string, string>>({});

  // Memos
  const currentSession = useMemo(() => 
    sessions.find(s => s.id === currentSessionId) || null,
    [sessions, currentSessionId]
  );

  const allMessages = useMemo(() => 
    currentSession ? currentSession.messages : [],
    [currentSession]
  );

  const selectedCRMCard = useMemo(() => 
    selectedCRMCardId ? cards.find(c => c.id === selectedCRMCardId) || null : null,
    [selectedCRMCardId, cards]
  );

  // ===================================================================
  // FUNÇÕES DE ATUALIZAÇÃO DE SESSÃO
  // ===================================================================
  const updateSessionById = useCallback(
    (sessionId: SessionId, updater: (session: ChatSession) => ChatSession) => {
      setSessions(prev =>
        prev.map(s =>
          s.id === sessionId 
            ? { ...updater(s), updatedAt: new Date().toISOString() } 
            : s
        )
      );
    },
    []
  );

  const updateCurrentSession = useCallback(
    (updater: (session: ChatSession) => ChatSession) => {
      if (!currentSessionId) return;
      updateSessionById(currentSessionId, updater);
    },
    [currentSessionId, updateSessionById]
  );

  // ===================================================================
  // INICIALIZAÇÃO
  // ===================================================================
  useEffect(() => {
    const initApp = async () => {
      try {
        const savedSessions = localStorage.getItem(SESSIONS_STORAGE_KEY);
        let localSessions: ChatSession[] = [];

        if (savedSessions) {
          try {
            const parsed = JSON.parse(savedSessions);
            localSessions = parsed.map((s: ChatSession) => ({
              ...s,
              messages: s.messages.map((m: Message) => ({
                ...m,
                text: cleanStatusMarkers(m.text || '').cleanText,
                timestamp: new Date(m.timestamp),
              })),
            }));
          } catch (e) {
            console.error('Erro ao carregar sessões:', e);
          }
        }

        setSessions(localSessions);
        
        if (localSessions.length > 0) {
          setCurrentSessionId(localSessions[0].id);
        } else {
          handleNewSession();
        }

        // Tema
        const savedTheme = localStorage.getItem(THEME_KEY);
        if (savedTheme) {
          setIsDarkMode(savedTheme === 'dark');
        }

        // Responsivo
        if (window.innerWidth < 768) {
          setIsSidebarOpen(false);
        }
      } catch (error) {
        console.error('Erro na inicialização:', error);
        toast.error('Erro ao inicializar aplicativo');
      } finally {
        setIsInitialized(true);
      }
    };

    initApp();
  }, []);

  // Salvar sessões
  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
  }, [sessions, isInitialized]);

  // Tema
  useEffect(() => {
    document.body.className = isDarkMode ? 'dark' : 'light';
    document.body.style.backgroundColor = isDarkMode ? '#020617' : '#f8fafc';
    document.body.style.color = isDarkMode ? '#e2e8f0' : '#0f172a';
    localStorage.setItem(THEME_KEY, isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Reset chat session ao mudar modo
  useEffect(() => {
    resetChatSession();
  }, [mode]);

  // ===================================================================
  // KEYBOARD SHORTCUTS
  // ===================================================================
  useKeyboardShortcuts([
    { key: 'k', ctrl: true, handler: () => toast.info('Command palette (em breve)'), preventDefault: true },
    { key: 'n', ctrl: true, handler: handleNewSession, preventDefault: true },
    { key: 'b', ctrl: true, handler: () => setIsSidebarOpen(prev => !prev), preventDefault: true },
    { key: 'd', ctrl: true, shift: true, handler: () => setIsDarkMode(prev => !prev), preventDefault: true },
    { key: 'Escape', handler: () => {
      if (abortControllerRef.current) {
        handleStopGeneration();
      }
    }},
  ]);

  // ===================================================================
  // HANDLERS
  // ===================================================================
  function handleNewSession() {
    if (isLoading && abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

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
    setRemoteSaveStatus('idle');
    setExportStatus('idle');
    setInvestigationLogged(false);
    lastActionRef.current = null;
    setLastQuery('');
    setLoadingStatus('Iniciando análise');
    setCompletedLoadingStatuses([]);
  }

  const handleSelectSession = useCallback(async (sessionId: SessionId) => {
    if (isLoading && abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setCurrentSessionId(sessionId);
    setVisibleCount(PAGE_SIZE);
    resetChatSession();
    setRemoteSaveStatus('idle');
    setExportStatus('idle');
    setInvestigationLogged(false);
    lastActionRef.current = null;
    setLoadingStatus('Iniciando análise');
  }, [isLoading]);

  const handleDeleteSession = useCallback((sessionId: SessionId) => {
    if (sessionId === currentSessionId && isLoading && abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }

    delete activeGenerationRef.current[sessionId];
    
    setSessions(prev => {
      const newSessions = prev.filter(s => s.id !== sessionId);
      
      if (currentSessionId === sessionId) {
        resetChatSession();
        if (newSessions.length > 0) {
          setCurrentSessionId(newSessions[0].id);
        } else {
          handleNewSession();
        }
      }
      
      return newSessions;
    });
  }, [currentSessionId, isLoading]);

  const handleClearChat = useCallback(() => {
    if (!window.confirm('Isso apagará todas as mensagens desta investigação. Continuar?')) return;
    
    resetChatSession();
    updateCurrentSession(session => ({
      ...session,
      messages: [],
      title: 'Nova Investigação',
      empresaAlvo: null,
      updatedAt: new Date().toISOString(),
    }));
    
    setInvestigationLogged(false);
    setLoadingStatus('Realizando pesquisa...');
    lastActionRef.current = null;
    setLastQuery('');
    setVisibleCount(PAGE_SIZE);
  }, [updateCurrentSession]);

  const handleStopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      toast.info('Geração interrompida');
    }
  }, [toast]);

  const handleRetry = useCallback(() => {
    if (!lastActionRef.current) return;
    
    if (lastActionRef.current.type === 'sendMessage') {
      const text = lastActionRef.current.payload.text as string;
      if (text) {
        processMessage(text, currentSessionId || undefined);
      }
    }
  }, [currentSessionId]);

  // ===================================================================
  // PROCESSAMENTO DE MENSAGEM
  // ===================================================================
  const processMessage = useCallback(async (
    text: string, 
    explicitSessionId?: SessionId,
    explicitHistory?: Message[]
  ) => {
    const sessionId = explicitSessionId || currentSessionId;
    if (!sessionId) return;

    // Validação
    const validation = validateMessage(text);
    if (!validation.success) {
      toast.error(validation.errors?.[0] || 'Mensagem inválida');
      return;
    }

    // Rate limiting
    const rateLimit = checkRateLimit(`msg-${userId || 'anon'}`, 30, 60000);
    if (!rateLimit.allowed) {
      toast.error('Muitas mensagens. Aguarde um momento.');
      return;
    }

    setIsLoading(true);
    setLoadingStatus('Realizando pesquisa...');
    setCompletedLoadingStatuses([]);
    setLastQuery(text);
    
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    lastActionRef.current = { type: 'sendMessage', payload: { text } };

    let historyToPass: Message[] = explicitHistory || [];
    
    if (!explicitHistory) {
      const session = sessions.find(s => s.id === sessionId);
      if (session) {
        const msgs = session.messages;
        historyToPass = msgs.length > 0 && 
          msgs[msgs.length - 1].text === text && 
          msgs[msgs.length - 1].sender === Sender.User
          ? msgs.slice(0, -1)
          : msgs;
      }
    }

    const botMessageId = createMessageId(uuidv4());
    activeGenerationRef.current[sessionId] = botMessageId;

    const botMessagePlaceholder: Message = {
      id: botMessageId,
      sender: Sender.Bot,
      text: '',
      timestamp: new Date(),
      isThinking: true,
      isSourcesOpen: false,
    };

    setSessions(prev => prev.map(s => 
      s.id === sessionId 
        ? {
            ...s,
            messages: [...s.messages.filter(m => !m.isError), botMessagePlaceholder],
            updatedAt: new Date().toISOString(),
          }
        : s
    ));
    
    setVisibleCount(prev => prev + 1);

    try {
      const { 
        text: responseText, 
        sources, 
        suggestions, 
        scorePorta 
      } = await sendMessageToGemini(
        text,
        historyToPass,
        systemInstruction,
        {
          signal,
          onText: () => {},
          onStatus: (newStatus) => {
            setLoadingStatus(prev => {
              if (prev && prev !== newStatus) {
                lastStatusRef.current = prev;
              }
              return newStatus;
            });
            
            if (lastStatusRef.current && lastStatusRef.current !== newStatus) {
              setCompletedLoadingStatuses(prev => 
                lastStatusRef.current && !prev.includes(lastStatusRef.current)
                  ? [...prev, lastStatusRef.current]
                  : prev
              );
            }
          },
          nomeVendedor: user?.displayName || 'Vendedor',
        }
      );

      if (activeGenerationRef.current[sessionId] !== botMessageId) return;

      const companyName = extractCompanyName(text);

      updateSessionById(sessionId, s => ({
        ...s,
        title: s.messages.length <= 2 || s.title === 'Nova Investigação'
          ? cleanTitle(companyName)
          : s.title,
        empresaAlvo: s.messages.length <= 2 ? companyName : s.empresaAlvo,
        messages: s.messages.map(msg =>
          msg.id === botMessageId
            ? {
                ...msg,
                text: responseText,
                groundingSources: sources,
                suggestions,
                scorePorta: scorePorta || undefined,
                isThinking: false,
              }
            : msg
        ),
      }));

      // Log de investigação
      if (!investigationLogged && responseText.length > 500) {
        setInvestigationLogged(true);
        // Analytics/Logging aqui
      }

      toast.success('Análise concluída!');

    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        setSessions(prev => prev.map(s => 
          s.id === sessionId 
            ? {
                ...s,
                messages: s.messages.filter(msg => 
                  msg.id !== botMessageId || msg.text.trim().length > 0
                ),
              }
            : s
        ));
        return;
      }

      if (activeGenerationRef.current[sessionId] !== botMessageId) return;

      const appError = normalizeAppError(error);
      
      updateSessionById(sessionId, s => ({
        ...s,
        messages: [...s.messages.filter(m => m.id !== botMessageId), {
          id: createMessageId(uuidv4()),
          sender: Sender.Bot,
          text: 'Erro no processamento',
          timestamp: new Date(),
          isError: true,
          errorDetails: appError,
        }],
      }));

      toast.error(appError.friendlyMessage);

    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [currentSessionId, sessions, systemInstruction, user, investigationLogged, toast, updateSessionById]);

  const handleSendMessage = useCallback(async (text: string, displayText?: string) => {
    let sessionId = currentSessionId;
    let currentHistory: Message[] = [];

    if (!sessionId) {
      sessionId = createSessionId(uuidv4());
      const immediateTitle = cleanTitle(extractCompanyName(displayText || text));
      
      const newSession: ChatSession = {
        id: sessionId,
        title: immediateTitle || 'Nova Investigação',
        empresaAlvo: immediateTitle || null,
        cnpj: null,
        modoPrincipal: null,
        scoreOportunidade: null,
        resumoDossie: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
      };

      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(sessionId);
      currentHistory = [];
    } else {
      const session = sessions.find(s => s.id === sessionId);
      currentHistory = session ? [...session.messages] : [];
    }

    const userMessage: Message = {
      id: createMessageId(uuidv4()),
      sender: Sender.User,
      text: displayText || text,
      timestamp: new Date(),
    };

    setSessions(prev => prev.map(s =>
      s.id === sessionId
        ? { ...s, messages: [...s.messages, userMessage], updatedAt: new Date().toISOString() }
        : s
    ));
    
    setVisibleCount(prev => prev + 1);
    await processMessage(text, sessionId, currentHistory);
  }, [currentSessionId, sessions, processMessage]);

  const handleDeepDive = useCallback(async (displayMessage: string, hiddenPrompt: string) => {
    const empresaContext = currentSession?.empresaAlvo || currentSession?.title || 'a empresa desta conversa';
    await handleSendMessage(
      `Com base em [${empresaContext}], execute o seguinte protocolo:\n\n${hiddenPrompt}`,
      displayMessage
    );
  }, [currentSession, handleSendMessage]);

  const handleDeleteMessage = useCallback((id: MessageId) => {
    if (!currentSessionId) return;
    
    updateSessionById(currentSessionId, session => ({
      ...session,
      messages: session.messages.filter(m => m.id !== id),
    }));
  }, [currentSessionId, updateSessionById]);

  // ===================================================================
  // EXPORTAÇÃO
  // ===================================================================
  const handleExportPDF = useCallback(() => {
    try {
      // Implementação do PDF generator
      toast.info('Exportação de PDF em desenvolvimento');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF');
    }
  }, [toast]);

  const handleExportConversation = useCallback(async (format: ExportFormat, reportType: ReportType) => {
    if (!currentSession) return;
    
    setExportStatus('loading');
    setExportError(null);

    try {
      const contentMarkdown = await generateConsolidatedDossier(
        currentSession.messages,
        systemInstruction,
        mode,
        reportType
      );

      const safeTitle = cleanTitle(currentSession.title).replace(/[^a-z0-9]/gi, '_').substring(0, 50);
      const dateStr = new Date().toISOString().slice(0, 10);
      const reportSuffix = reportType === 'executive' ? 'EXEC' : reportType === 'tech' ? 'FICHA' : 'DOSSIE';
      const filename = `SeniorScout_${safeTitle}_${reportSuffix}_${dateStr}`;

      if (format === 'md') {
        downloadFile(`${filename}.md`, contentMarkdown, 'text/markdown;charset=utf-8');
      }

      setExportStatus('success');
      toast.success('Exportação concluída!');
      
      setTimeout(() => setExportStatus('idle'), 3000);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Falha ao gerar arquivo';
      setExportError(errMsg);
      setExportStatus('error');
      toast.error(errMsg);
    }
  }, [currentSession, systemInstruction, mode, toast]);

  // ===================================================================
  // FEEDBACK
  // ===================================================================
  const handleFeedback = useCallback((messageId: MessageId, feedback: Feedback) => {
    if (!currentSessionId) return;
    
    updateSessionById(currentSessionId, session => ({
      ...session,
      messages: session.messages.map(m =>
        m.id === messageId ? { ...m, feedback: m.feedback === feedback ? undefined : feedback } : m
      ),
    }));
  }, [currentSessionId, updateSessionById]);

  const handleToggleMessageSources = useCallback((messageId: MessageId) => {
    updateCurrentSession(session => ({
      ...session,
      messages: session.messages.map(msg =>
        msg.id === messageId ? { ...msg, isSourcesOpen: !msg.isSourcesOpen } : msg
      ),
    }));
  }, [updateCurrentSession]);

  // ===================================================================
  // CRM
  // ===================================================================
  const handleSaveToCRM = useCallback(async (sessionId: SessionId) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    const existingCard = cards.find(c => c.id === `crm_${sessionId}`);
    if (existingCard) {
      setSelectedCRMCardId(existingCard.id);
      setActiveView('crm');
      return;
    }

    try {
      const card = await createCardFromSession(session);
      setSelectedCRMCardId(card.id);
      setActiveView('crm');
      toast.success('Empresa adicionada ao CRM!');
    } catch (error) {
      toast.error('Erro ao adicionar ao CRM');
    }
  }, [sessions, cards, createCardFromSession, toast]);

  const handleCreateManualCRMCard = useCallback(async () => {
    if (!newCrmName.trim()) return;
    
    setIsCreatingCrmCard(true);
    
    try {
      const card = await createManualCard({
        companyName: newCrmName.trim(),
        website: newCrmWebsite.trim() || undefined,
        briefDescription: newCrmResumo.trim() || undefined,
        stage: 'prospeccao',
      });

      setNewCrmName('');
      setNewCrmWebsite('');
      setNewCrmResumo('');
      setShowNewCrmForm(false);
      setSelectedCRMCardId(card.id);
      toast.success('Empresa criada com sucesso!');
    } catch (error) {
      toast.error('Erro ao criar empresa');
    } finally {
      setIsCreatingCrmCard(false);
    }
  }, [newCrmName, newCrmWebsite, newCrmResumo, createManualCard, toast]);

  // ===================================================================
  // RENDER
  // ===================================================================
  if (!isInitialized) {
    return (
      <div className={`flex h-screen w-full items-center justify-center ${
        isDarkMode ? 'bg-slate-950' : 'bg-slate-50'
      }`}>
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size="lg" isDarkMode={isDarkMode} />
          <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Preparando ambiente...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-screen w-full ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} position="top-right" />

      {/* Offline Banner */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-0 inset-x-0 z-[100] flex items-center justify-center gap-2 bg-amber-500 text-amber-950 text-xs font-semibold py-1.5 px-4 shadow-lg"
          >
            <span>📡</span>
            Sem conexão — algumas funções ficam indisponíveis offline
          </motion.div>
        )}

        {isOnline && wasOffline && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-0 inset-x-0 z-[100] flex items-center justify-center gap-2 bg-emerald-600 text-white text-xs font-semibold py-1.5 px-4 shadow-lg cursor-pointer"
            onClick={clearWasOffline}
          >
            <span>✓</span>
            Conexão restabelecida ✕
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <Suspense fallback={null}>
        <AuthModal />
      </Suspense>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {activeView === 'chat' ? (
          <motion.div
            key="chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 h-full"
          >
            <Suspense fallback={<LoadingSpinner isDarkMode={isDarkMode} />}>
              <ErrorBoundary componentName="ChatInterface">
                <ChatInterface
                  currentSession={currentSession}
                  sessions={sessions}
                  onNewSession={handleNewSession}
                  onSelectSession={handleSelectSession}
                  onDeleteSession={handleDeleteSession}
                  onSaveToCRM={handleSaveToCRM}
                  onOpenKanban={() => setActiveView('crm')}
                  isSidebarOpen={isSidebarOpen}
                  onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                  messages={allMessages.slice(-visibleCount)}
                  isLoading={isLoading}
                  hasMore={allMessages.length > visibleCount}
                  onSendMessage={handleSendMessage}
                  onDeepDive={handleDeepDive}
                  onFeedback={handleFeedback}
                  onLoadMore={() => setVisibleCount(prev => prev + PAGE_SIZE)}
                  onExportConversation={handleExportConversation}
                  onExportPDF={handleExportPDF}
                  onRetry={handleRetry}
                  onClearChat={handleClearChat}
                  onStop={handleStopGeneration}
                  isDarkMode={isDarkMode}
                  onToggleTheme={() => setIsDarkMode(!isDarkMode)}
                  onToggleMessageSources={handleToggleMessageSources}
                  exportStatus={exportStatus}
                  exportError={exportError}
                  onOpenEmailModal={() => setShowEmailModal(true)}
                  onOpenFollowUpModal={() => setShowFollowUpModal(true)}
                  processing={{
                    stage: loadingStatus,
                    completedStages: completedLoadingStatuses,
                  }}
                  onDeleteMessage={handleDeleteMessage}
                />
              </ErrorBoundary>
            </Suspense>
          </motion.div>
        ) : (
          <motion.div
            key="crm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 h-full"
          >
            <Suspense fallback={<LoadingSpinner isDarkMode={isDarkMode} />}>
              <ErrorBoundary componentName="CRM">
                <div className={`flex h-full w-full ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
                  <div className="flex-1 p-4 md:p-6 overflow-y-auto">
                    <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          Pipeline · Kanban
                        </p>
                        <h1 className="text-sm md:text-base font-semibold text-slate-800 dark:text-slate-100">
                          Mini CRM
                        </h1>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowNewCrmForm(prev => !prev)}
                          className="text-[11px] px-3 py-1.5 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 font-medium transition-colors"
                        >
                          {showNewCrmForm ? '✕ Cancelar' : '+ Nova empresa'}
                        </button>
                        <button
                          onClick={() => setActiveView('chat')}
                          className="text-[11px] px-3 py-1.5 rounded-full border border-slate-300/70 dark:border-slate-700 text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          ← Voltar
                        </button>
                      </div>
                    </div>

                    {showNewCrmForm && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className={`mb-5 rounded-xl border p-4 space-y-3 ${
                          isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <input
                            type="text"
                            value={newCrmName}
                            onChange={e => setNewCrmName(e.target.value)}
                            placeholder="Nome da empresa *"
                            autoFocus
                            className={`rounded-lg border px-3 py-2 text-sm bg-transparent ${
                              isDarkMode ? 'border-slate-700 text-slate-100' : 'border-slate-300 text-slate-900'
                            }`}
                          />
                          <input
                            type="text"
                            value={newCrmWebsite}
                            onChange={e => setNewCrmWebsite(e.target.value)}
                            placeholder="Website (opcional)"
                            className={`rounded-lg border px-3 py-2 text-sm bg-transparent ${
                              isDarkMode ? 'border-slate-700 text-slate-100' : 'border-slate-300 text-slate-900'
                            }`}
                          />
                          <input
                            type="text"
                            value={newCrmResumo}
                            onChange={e => setNewCrmResumo(e.target.value)}
                            placeholder="Resumo breve (opcional)"
                            className={`rounded-lg border px-3 py-2 text-sm bg-transparent ${
                              isDarkMode ? 'border-slate-700 text-slate-100' : 'border-slate-300 text-slate-900'
                            }`}
                          />
                        </div>
                        <div className="flex justify-end">
                          <button
                            onClick={handleCreateManualCRMCard}
                            disabled={!newCrmName.trim() || isCreatingCrmCard}
                            className="px-4 py-2 rounded-lg text-[12px] font-semibold bg-emerald-600 text-white hover:bg-emerald-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
                          >
                            {isCreatingCrmCard ? 'Criando...' : 'Criar empresa'}
                          </button>
                        </div>
                      </motion.div>
                    )}

                    <CRMPipeline
                      cards={cards}
                      onMoveCard={moveCardToStage}
                      onSelectCard={setSelectedCRMCardId}
                    />
                  </div>
                </div>
              </ErrorBoundary>
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default memo(AppCore);
