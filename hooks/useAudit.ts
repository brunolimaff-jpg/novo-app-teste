import { useState, useEffect, useCallback, useRef } from 'react';
import type { AuditLogEntry, AuditAction } from '../types/features';

const AUDIT_STORAGE_KEY = 'scout360_audit_log';
const MAX_LOG_ENTRIES = 1000;

export function useAudit(userId?: string) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isAuditPanelOpen, setIsAuditPanelOpen] = useState(false);
  const logsRef = useRef<AuditLogEntry[]>([]);

  // Load logs from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem(AUDIT_STORAGE_KEY);
      if (saved) {
        const parsed: AuditLogEntry[] = JSON.parse(saved);
        setLogs(parsed);
        logsRef.current = parsed;
      }
    } catch {
      console.error('Failed to load audit logs');
    }
  }, []);

  // Save logs to localStorage (debounced)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const timeout = setTimeout(() => {
      try {
        // Keep only last MAX_LOG_ENTRIES
        const trimmed = logsRef.current.slice(-MAX_LOG_ENTRIES);
        localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(trimmed));
      } catch {
        console.error('Failed to save audit logs');
      }
    }, 1000);

    return () => clearTimeout(timeout);
  }, [logs]);

  const logAction = useCallback((
    action: AuditAction,
    details: Record<string, unknown> = {},
    sessionId?: string
  ) => {
    const entry: AuditLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      action,
      userId,
      sessionId,
      details,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    logsRef.current = [...logsRef.current, entry];
    setLogs(logsRef.current);
  }, [userId]);

  const logMessageSent = useCallback((sessionId: string, messageLength: number) => {
    logAction('message_sent', { messageLength }, sessionId);
  }, [logAction]);

  const logMessageReceived = useCallback((sessionId: string, responseLength: number) => {
    logAction('message_received', { responseLength }, sessionId);
  }, [logAction]);

  const logSessionCreated = useCallback((sessionId: string, title: string) => {
    logAction('session_created', { title }, sessionId);
  }, [logAction]);

  const logSessionDeleted = useCallback((sessionId: string) => {
    logAction('session_deleted', {}, sessionId);
  }, [logAction]);

  const logSessionExported = useCallback((sessionId: string, format: string) => {
    logAction('session_exported', { format }, sessionId);
  }, [logAction]);

  const logCRMCardCreated = useCallback((cardId: string, companyName: string) => {
    logAction('crm_card_created', { cardId, companyName });
  }, [logAction]);

  const logCRMCardMoved = useCallback((cardId: string, fromStage: string, toStage: string) => {
    logAction('crm_card_moved', { cardId, fromStage, toStage });
  }, [logAction]);

  const logThemeChanged = useCallback((themeId: string, themeName: string) => {
    logAction('theme_changed', { themeId, themeName });
  }, [logAction]);

  const logAgentChanged = useCallback((agentId: string, agentName: string) => {
    logAction('agent_changed', { agentId, agentName });
  }, [logAction]);

  const logTemplateUsed = useCallback((templateId: string, templateName: string) => {
    logAction('template_used', { templateId, templateName });
  }, [logAction]);

  const logWorkflowTriggered = useCallback((workflowId: string, workflowName: string) => {
    logAction('workflow_triggered', { workflowId, workflowName });
  }, [logAction]);

  const logSettingsChanged = useCallback((setting: string, oldValue: unknown, newValue: unknown) => {
    logAction('settings_changed', { setting, oldValue, newValue });
  }, [logAction]);

  const getLogsBySession = useCallback((sessionId: string) => {
    return logs.filter(log => log.sessionId === sessionId);
  }, [logs]);

  const getLogsByAction = useCallback((action: AuditAction) => {
    return logs.filter(log => log.action === action);
  }, [logs]);

  const getLogsByDateRange = useCallback((start: number, end: number) => {
    return logs.filter(log => log.timestamp >= start && log.timestamp <= end);
  }, [logs]);

  const clearLogs = useCallback(() => {
    if (window.confirm('Tem certeza que deseja limpar todos os logs de auditoria?')) {
      logsRef.current = [];
      setLogs([]);
      localStorage.removeItem(AUDIT_STORAGE_KEY);
    }
  }, []);

  const exportLogs = useCallback(() => {
    const data = JSON.stringify(logs, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scout360-audit-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [logs]);

  const toggleAuditPanel = useCallback(() => {
    setIsAuditPanelOpen(prev => !prev);
  }, []);

  const formatTimestamp = useCallback((timestamp: number): string => {
    return new Date(timestamp).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }, []);

  const getActionLabel = useCallback((action: AuditAction): string => {
    const labels: Record<AuditAction, string> = {
      message_sent: 'Mensagem enviada',
      message_received: 'Mensagem recebida',
      session_created: 'Sessão criada',
      session_deleted: 'Sessão excluída',
      session_exported: 'Sessão exportada',
      crm_card_created: 'Card CRM criado',
      crm_card_moved: 'Card CRM movido',
      theme_changed: 'Tema alterado',
      agent_changed: 'Agente alterado',
      template_used: 'Template usado',
      workflow_triggered: 'Workflow disparado',
      settings_changed: 'Configurações alteradas',
    };
    return labels[action] || action;
  }, []);

  return {
    logs,
    logsCount: logs.length,
    isAuditPanelOpen,
    logAction,
    logMessageSent,
    logMessageReceived,
    logSessionCreated,
    logSessionDeleted,
    logSessionExported,
    logCRMCardCreated,
    logCRMCardMoved,
    logThemeChanged,
    logAgentChanged,
    logTemplateUsed,
    logWorkflowTriggered,
    logSettingsChanged,
    getLogsBySession,
    getLogsByAction,
    getLogsByDateRange,
    clearLogs,
    exportLogs,
    toggleAuditPanel,
    setIsAuditPanelOpen,
    formatTimestamp,
    getActionLabel,
  };
}
