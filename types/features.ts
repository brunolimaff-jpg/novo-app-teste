// ===================================================================
// FEATURES - NOVOS TIPOS
// ===================================================================

// 1.1 Multi-Agent System
export type AgentType = 'research' | 'sales' | 'technical' | 'strategy' | 'default';

export interface Agent {
  id: string;
  type: AgentType;
  name: string;
  description: string;
  icon: string;
  systemPrompt: string;
  color: string;
  capabilities: string[];
  isActive: boolean;
}

export const AGENTS: Agent[] = [
  {
    id: 'default',
    type: 'default',
    name: 'Scout 360',
    description: 'Agente geral de inteligência comercial',
    icon: '🎯',
    systemPrompt: 'Você é o Senior Scout 360 — um agente de inteligência comercial da Senior Sistemas.',
    color: '#10b981',
    capabilities: ['pesquisa', 'análise', 'dossiê'],
    isActive: true,
  },
  {
    id: 'research',
    type: 'research',
    name: 'Research Pro',
    description: 'Especialista em pesquisa profunda e OSINT',
    icon: '🔍',
    systemPrompt: 'Você é um analista de pesquisa OSINT. Use somente fontes públicas e legítimas.',
    color: '#3b82f6',
    capabilities: ['varredura web', 'análise de concorrentes', 'fontes públicas'],
    isActive: true,
  },
  {
    id: 'sales',
    type: 'sales',
    name: 'Sales Hunter',
    description: 'Focado em ganchos comerciais e oportunidades',
    icon: '💼',
    systemPrompt: 'Você é um caçador de oportunidades comerciais. Foque em gaps tecnológicos.',
    color: '#f59e0b',
    capabilities: ['qualificação', 'objeções', 'proposta'],
    isActive: true,
  },
  {
    id: 'technical',
    type: 'technical',
    name: 'Tech Analyst',
    description: 'Análise técnica de infraestrutura e sistemas',
    icon: '⚙️',
    systemPrompt: 'Você é um analista técnico. Mapeie a stack tecnológica e identifique gaps.',
    color: '#8b5cf6',
    capabilities: ['stack tech', 'integrações', 'arquitetura'],
    isActive: true,
  },
  {
    id: 'strategy',
    type: 'strategy',
    name: 'Strategy Master',
    description: 'Análise estratégica e benchmarking',
    icon: '♟️',
    systemPrompt: 'Você é um estrategista. Analise posicionamento de mercado e tendências.',
    color: '#ec4899',
    capabilities: ['benchmarking', 'tendências', 'posicionamento'],
    isActive: true,
  },
];

// 3.1 Modo Offline Avançado
export interface OfflineQueueItem {
  id: string;
  type: 'message' | 'export' | 'sync';
  payload: unknown;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

export interface OfflineState {
  isOffline: boolean;
  queue: OfflineQueueItem[];
  lastSyncAt: number | null;
  pendingChanges: number;
}

// 3.2 Tema Personalizável
export interface CustomTheme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    border: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  isDark: boolean;
  isDefault?: boolean;
}

export const DEFAULT_THEMES: CustomTheme[] = [
  {
    id: 'senior-default',
    name: 'Senior (Padrão)',
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
    isDark: false,
    isDefault: true,
  },
  {
    id: 'senior-dark',
    name: 'Senior (Escuro)',
    colors: {
      primary: '#34d399',
      secondary: '#60a5fa',
      accent: '#fbbf24',
      background: '#020617',
      surface: '#0f172a',
      text: '#e2e8f0',
      textMuted: '#94a3b8',
      border: '#1e293b',
      success: '#4ade80',
      warning: '#fbbf24',
      error: '#f87171',
      info: '#60a5fa',
    },
    isDark: true,
    isDefault: true,
  },
  {
    id: 'high-contrast',
    name: 'Alto Contraste',
    colors: {
      primary: '#00ff00',
      secondary: '#00ffff',
      accent: '#ffff00',
      background: '#000000',
      surface: '#111111',
      text: '#ffffff',
      textMuted: '#cccccc',
      border: '#ffffff',
      success: '#00ff00',
      warning: '#ffff00',
      error: '#ff0000',
      info: '#00ffff',
    },
    isDark: true,
    isDefault: true,
  },
];

// 3.3 Atalhos de Teclado
export interface KeyboardShortcut {
  id: string;
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  description: string;
  category: 'navegação' | 'ação' | 'visualização' | 'edição';
  action: () => void;
}

export const DEFAULT_SHORTCUTS: Omit<KeyboardShortcut, 'action'>[] = [
  { id: 'new-session', key: 'n', ctrl: true, description: 'Nova sessão', category: 'ação' },
  { id: 'toggle-sidebar', key: 'b', ctrl: true, description: 'Alternar sidebar', category: 'visualização' },
  { id: 'toggle-theme', key: 'd', ctrl: true, shift: true, description: 'Alternar tema', category: 'visualização' },
  { id: 'focus-input', key: 'k', ctrl: true, description: 'Focar no input', category: 'navegação' },
  { id: 'search-sessions', key: 'f', ctrl: true, description: 'Buscar sessões', category: 'navegação' },
  { id: 'export-md', key: 'e', ctrl: true, shift: true, description: 'Exportar Markdown', category: 'ação' },
  { id: 'clear-chat', key: 'Delete', ctrl: true, shift: true, description: 'Limpar chat', category: 'ação' },
  { id: 'stop-generation', key: 'Escape', description: 'Parar geração', category: 'ação' },
  { id: 'next-session', key: 'j', ctrl: true, description: 'Próxima sessão', category: 'navegação' },
  { id: 'prev-session', key: 'k', ctrl: true, description: 'Sessão anterior', category: 'navegação' },
  { id: 'toggle-agent', key: 'a', ctrl: true, description: 'Trocar agente', category: 'ação' },
  { id: 'open-templates', key: 't', ctrl: true, description: 'Abrir templates', category: 'ação' },
  { id: 'open-workflows', key: 'w', ctrl: true, description: 'Abrir workflows', category: 'ação' },
];

// 4.3 Auditoria
export type AuditAction = 
  | 'message_sent'
  | 'message_received'
  | 'session_created'
  | 'session_deleted'
  | 'session_exported'
  | 'crm_card_created'
  | 'crm_card_moved'
  | 'theme_changed'
  | 'agent_changed'
  | 'template_used'
  | 'workflow_triggered'
  | 'settings_changed';

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  action: AuditAction;
  userId?: string;
  sessionId?: string;
  details: Record<string, unknown>;
  userAgent: string;
  url: string;
}

// 7.1 Compartilhamento de Sessões
export interface SharedSession {
  id: string;
  sessionId: string;
  encryptedData: string;
  passwordHash?: string;
  expiresAt: number;
  viewCount: number;
  maxViews?: number;
  createdAt: number;
  createdBy: string;
}

// 7.3 Templates
export interface InvestigationTemplate {
  id: string;
  name: string;
  description: string;
  category: 'qualificação' | 'dossiê' | 'follow-up' | 'proposta' | 'custom';
  prompts: string[];
  isDefault: boolean;
  createdAt: number;
  usageCount: number;
}

export const DEFAULT_TEMPLATES: InvestigationTemplate[] = [
  {
    id: 'qualificacao-basica',
    name: 'Qualificação Básica',
    description: 'Qualificação inicial de lead',
    category: 'qualificação',
    prompts: [
      'Qual o porte da empresa?',
      'Quais sistemas eles usam atualmente?',
      'Quem são os decisores?',
      'Qual o orçamento estimado?',
    ],
    isDefault: true,
    createdAt: Date.now(),
    usageCount: 0,
  },
  {
    id: 'dossie-completo',
    name: 'Dossiê Completo',
    description: 'Investigação completa da empresa',
    category: 'dossiê',
    prompts: [
      'Faça uma análise completa da empresa incluindo:',
      '- Dados cadastrais e quadro societário',
      '- Histórico e trajetória',
      '- Produtos e serviços',
      '- Concorrentes e posicionamento',
      '- Stack tecnológica atual',
      '- Oportunidades de venda Senior',
    ],
    isDefault: true,
    createdAt: Date.now(),
    usageCount: 0,
  },
  {
    id: 'follow-up-30dias',
    name: 'Follow-up 30 dias',
    description: 'Checklist de acompanhamento',
    category: 'follow-up',
    prompts: [
      'Verificar últimas interações com o cliente',
      'Identificar novidades da empresa no último mês',
      'Atualizar informações de contato',
      'Revisar objeções anteriores',
    ],
    isDefault: true,
    createdAt: Date.now(),
    usageCount: 0,
  },
  {
    id: 'proposta-tecnica',
    name: 'Proposta Técnica',
    description: 'Base para proposta técnica',
    category: 'proposta',
    prompts: [
      'Mapear necessidades técnicas identificadas',
      'Listar integrações necessárias',
      'Identificar customizações potenciais',
      'Estimar esforço de implementação',
    ],
    isDefault: true,
    createdAt: Date.now(),
    usageCount: 0,
  },
];

// 8.1 Workflows
export type WorkflowTrigger = 'on_message' | 'on_export' | 'on_crm_move' | 'scheduled' | 'manual';
export type WorkflowAction = 'send_reminder' | 'create_task' | 'export_data' | 'notify' | 'webhook';

export interface Workflow {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  trigger: WorkflowTrigger;
  conditions: {
    field: string;
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
    value: string | number;
  }[];
  actions: {
    type: WorkflowAction;
    config: Record<string, unknown>;
  }[];
  createdAt: number;
  lastRunAt?: number;
  runCount: number;
}

// 8.3 Agendamento
export interface ScheduledTask {
  id: string;
  type: 'reminder' | 'follow_up' | 'report' | 'sync';
  title: string;
  description?: string;
  scheduledAt: number;
  recurrence?: 'daily' | 'weekly' | 'monthly' | 'none';
  relatedSessionId?: string;
  relatedCardId?: string;
  isCompleted: boolean;
  notified: boolean;
}

// 9.1 Acessibilidade
export interface AccessibilitySettings {
  highContrast: boolean;
  reduceMotion: boolean;
  largeText: boolean;
  screenReaderOptimized: boolean;
  keyboardOnly: boolean;
  focusIndicator: 'default' | 'enhanced' | 'hidden';
  colorBlindMode: 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia';
}

export const DEFAULT_ACCESSIBILITY: AccessibilitySettings = {
  highContrast: false,
  reduceMotion: false,
  largeText: false,
  screenReaderOptimized: false,
  keyboardOnly: false,
  focusIndicator: 'enhanced',
  colorBlindMode: 'none',
};
