import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import type { ChatMode } from '../types';

interface ModeContextType {
  mode: ChatMode;
  setMode: (mode: ChatMode) => void;
  toggleMode: () => void;
  systemInstruction: string;
  isInitialized: boolean;
}

const STORAGE_KEY = 'scout360_mode';
const DEFAULT_MODE: ChatMode = 'diretoria';

const DIRETORIA_PROMPT = `
Você é o Senior Scout 360 — um agente de inteligência comercial da Senior Sistemas.
Seu papel é gerar dossiês estratégicos de alta qualidade para a equipe comercial.

DIRETRIZES:
- Seja direto, factual e estratégico
- Priorize insights acionáveis para vendas
- Use dados verificáveis com fontes
- Foque em gaps tecnológicos e oportunidades Senior
`;

const OPERACAO_PROMPT = `
Você é o Senior Scout 360 — um agente de inteligência comercial da Senior Sistemas.
Seu papel é gerar dossiês táticos e operacionais para a equipe comercial.

DIRETRIZES:
- Seja prático e direto ao ponto
- Foque em informações úteis para o dia a dia
- Priorize dados de contato e decisores
- Use linguagem acessível
`;

const MODE_LABELS: Record<ChatMode, { icon: string; label: string }> = {
  diretoria: { icon: '✈️', label: 'Diretoria' },
  operacao: { icon: '🚺', label: 'Operação' },
};

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export const ModeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ChatMode>(DEFAULT_MODE);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const savedMode = localStorage.getItem(STORAGE_KEY);
      
      // Migração de nomes antigos
      if (savedMode === 'sincerao') {
        setModeState('operacao');
        localStorage.setItem(STORAGE_KEY, 'operacao');
      } else if (savedMode === 'normal') {
        setModeState('diretoria');
        localStorage.setItem(STORAGE_KEY, 'diretoria');
      } else if (savedMode === 'operacao' || savedMode === 'diretoria') {
        setModeState(savedMode);
      }
    } catch {
      // Fallback se localStorage não disponível
    } finally {
      setIsInitialized(true);
    }
  }, []);

  const setMode = useCallback((newMode: ChatMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem(STORAGE_KEY, newMode);
    } catch {
      // Ignore storage errors
    }
  }, []);

  const toggleMode = useCallback(() => {
    const newMode = mode === 'operacao' ? 'diretoria' : 'operacao';
    setMode(newMode);
  }, [mode, setMode]);

  const systemInstruction = useMemo(() => 
    mode === 'operacao' ? OPERACAO_PROMPT : DIRETORIA_PROMPT,
    [mode]
  );

  const value = useMemo(() => ({
    mode,
    setMode,
    toggleMode,
    systemInstruction,
    isInitialized,
  }), [mode, setMode, toggleMode, systemInstruction, isInitialized]);

  return (
    <ModeContext.Provider value={value}>
      {children}
    </ModeContext.Provider>
  );
};

export const useMode = (): ModeContextType => {
  const context = useContext(ModeContext);
  if (context === undefined) {
    throw new Error('useMode deve ser usado dentro de um ModeProvider');
  }
  return context;
};

export { MODE_LABELS };
