import React from 'react';

// ===================================================================
// BRANDED TYPES - Type Safety Melhorado
// ===================================================================
declare const __brand: unique symbol;
export type Brand<B> = { [__brand]: B };
export type Branded<T, B> = T & Brand<B>;

export type MessageId = Branded<string, 'MessageId'>;
export type SessionId = Branded<string, 'SessionId'>;
export type UserId = Branded<string, 'UserId'>;
export type CardId = Branded<string, 'CardId'>;

export const createMessageId = (id: string): MessageId => id as MessageId;
export const createSessionId = (id: string): SessionId => id as SessionId;
export const createUserId = (id: string): UserId => id as UserId;
export const createCardId = (id: string): CardId => id as CardId;

// ===================================================================
// ENUMS E TIPOS BASE
// ===================================================================
export enum Sender {
  User = 'user',
  Bot = 'bot'
}

export type Feedback = 'up' | 'down';

export type ExportFormat = 'md' | 'pdf' | 'doc';

export type ReportType = 'executive' | 'full' | 'tech';

export type ErrorCode = 
  | 'NETWORK' 
  | 'TIMEOUT' 
  | 'RATE_LIMIT' 
  | 'MODEL_OVERLOADED' 
  | 'AUTH' 
  | 'BAD_REQUEST' 
  | 'SERVER' 
  | 'PARSER' 
  | 'UNKNOWN'
  | 'ABORTED'
  | 'BLOCKED_CONTENT'
  | 'GUARD';

export type ErrorSource = 'GEMINI' | 'BRASIL_API' | 'APPS_SCRIPT' | 'EXPORT' | 'PARSER' | 'UI' | 'UNKNOWN' | 'GUARD';

// ===================================================================
// INTERFACES DE ERRO
// ===================================================================
export interface AppError {
  code: ErrorCode;
  message: string;
  friendlyMessage: string;
  httpStatus?: number;
  retryable: boolean;
  transient: boolean;
  source: ErrorSource;
  details?: Record<string, unknown>;
}

// ===================================================================
// SCORE PORTA
// ===================================================================
export interface ScorePortaData {
  score: number;
  p: number;
  o: number;
  r: number;
  t: number;
  a: number;
}

export interface ParsedContent {
  text: string;
  statuses: string[];
  scorePorta: ScorePortaData | null;
}

// ===================================================================
// MENSAGENS E SESSÕES
// ===================================================================
export interface GroundingSource {
  title: string;
  url: string;
}

export interface Message {
  id: MessageId;
  sender: Sender;
  text: string;
  timestamp: Date;
  isThinking?: boolean;
  groundingSources?: GroundingSource[];
  feedback?: Feedback;
  sectionFeedback?: Record<string, Feedback>;
  suggestions?: string[];
  isRegeneratingSuggestions?: boolean;
  isError?: boolean;
  errorDetails?: AppError;
  isSourcesOpen?: boolean;
  scorePorta?: ScorePortaData;
  statuses?: string[];
}

export interface ChatSession {
  id: SessionId;
  title: string;
  empresaAlvo: string | null;
  cnpj: string | null;
  modoPrincipal: string | null;
  scoreOportunidade: number | null;
  resumoDossie: string | null;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
  companyContext?: string;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

// ===================================================================
// CRM - KANBAN
// ===================================================================
export type CRMStage =
  | 'prospeccao'
  | 'primeira_reuniao'
  | 'levantamento'
  | 'defesa_tecnica'
  | 'dossie_final';

export const CRM_STAGE_LABELS: Record<CRMStage, string> = {
  prospeccao: 'Prospecção',
  primeira_reuniao: '1ª Reunião',
  levantamento: 'Levantamento',
  defesa_tecnica: 'Defesa Técnica',
  dossie_final: 'Dossiê Final',
};

export type DealHealth = 'green' | 'yellow' | 'red';

export interface CRMTranscriptionFile {
  id: string;
  name: string;
  content: string;
  uploadedAt: string;
  type: 'txt' | 'docx';
}

export interface CRMStageData {
  transcriptions: CRMTranscriptionFile[];
  executiveNotes: string;
  technicalNotes: string;
  aiReport?: string;
  crmNotes?: string;
  generatedAt?: string;
  objections?: string[];
  competitors?: string[];
}

export interface CRMCard {
  id: CardId;
  companyName: string;
  cnpj?: string | null;
  cnpjs?: string[];
  website?: string;
  briefDescription?: string;
  exactLink?: string;
  linkedSessionIds: SessionId[];
  stage: CRMStage;
  createdAt: string;
  updatedAt: string;
  movedToStageAt: Partial<Record<CRMStage, string>>;
  stages: Partial<Record<CRMStage, CRMStageData>>;
  latestScorePorta?: number;
  health: DealHealth;
  newsRadarEnabled: boolean;
  lastNewsCheckAt?: string;
  unreadNewsCount?: number;
}

// ===================================================================
// PROPS DE COMPONENTES
// ===================================================================
export interface ChatInterfaceProps {
  currentSession: ChatSession | null;
  sessions: ChatSession[];
  onNewSession: () => void;
  onSelectSession: (sessionId: SessionId) => void;
  onDeleteSession: (sessionId: SessionId) => void;
  onSaveToCRM: (sessionId: SessionId) => void;
  onDeepDive: (displayMessage: string, hiddenPrompt: string) => Promise<void>;
  onOpenKanban: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  messages: Message[];
  isLoading: boolean;
  hasMore: boolean;
  onSendMessage: (text: string, displayText?: string) => void;
  onFeedback: (messageId: MessageId, feedback: Feedback) => void;
  onSendFeedback: (messageId: MessageId, feedback: Feedback, comment: string, content: string) => void;
  onSectionFeedback: (messageId: MessageId, sectionTitle: string, feedback: Feedback) => void;
  onLoadMore: () => void;
  onExportConversation: (format: ExportFormat, reportType: ReportType) => void;
  onExportPDF: () => void;
  onExportMessage: (messageId: MessageId) => void;
  onRetry: () => void;
  onClearChat: () => void;
  onRegenerateSuggestions: (messageId: MessageId) => void;
  onStop?: () => void;
  onReportError?: (messageId: MessageId, error: AppError) => void;
  onSaveRemote: () => void;
  isSavingRemote: boolean;
  remoteSaveStatus: 'idle' | 'success' | 'error';
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onToggleMessageSources: (messageId: MessageId) => void;
  exportStatus: 'idle' | 'loading' | 'success' | 'error';
  exportError: string | null;
  pdfReportContent: string | null;
  onOpenEmailModal: () => void;
  onOpenFollowUpModal: () => void;
  userHeaderNode: React.ReactNode;
  onLogout: () => void;
  lastUserQuery?: string;
  processing?: {
    stage?: string;
    completedStages?: string[];
  };
  onDeleteMessage?: (id: MessageId) => void;
}

export interface CRMPipelineProps {
  cards: CRMCard[];
  onMoveCard: (cardId: CardId, toStage: CRMStage) => void;
  onSelectCard: (cardId: CardId) => void;
}

// ===================================================================
// CACHE E PERFORMANCE
// ===================================================================
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface LoadingState {
  stage: 'consulting_db' | 'searching_public' | 'analyzing' | 'generating' | 'idle';
  progress: number;
  estimatedTime: number;
  details: string;
}

// ===================================================================
// ANALYTICS E TRACKING
// ===================================================================
export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, unknown>;
  timestamp: number;
}

export interface PerformanceMetrics {
  fcp: number;
  lcp: number;
  cls: number;
  fid: number;
  ttfb: number;
}
