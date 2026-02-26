import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { del, set } from 'idb-keyval';
import type { ChatSession, CRMCard, CRMStage, DealHealth, Sender } from '../types';

const LOCAL_KEY = 'scout360_crm_cards_v1';

interface CRMContextValue {
  cards: CRMCard[];
  isLoading: boolean;
  error: string | null;
  createCardFromSession: (session: ChatSession) => Promise<CRMCard>;
  createManualCard: (input: {
    companyName: string;
    cnpj?: string;
    website?: string;
    briefDescription?: string;
    stage?: CRMStage;
  }) => Promise<CRMCard>;
  updateCard: (card: CRMCard) => Promise<void>;
  deleteCard: (cardId: string) => Promise<void>;
  moveCardToStage: (cardId: string, stage: CRMStage) => Promise<void>;
  getCardById: (cardId: string) => CRMCard | undefined;
  getCardsByStage: (stage: CRMStage) => CRMCard[];
  refreshHealth: () => void;
}

const CRMContext = createContext<CRMContextValue | undefined>(undefined);

function computeHealth(card: CRMCard): DealHealth {
  const now = Date.now();

  const movedAt = card.movedToStageAt[card.stage];
  const daysSinceMoved = movedAt
    ? (now - new Date(movedAt).getTime()) / 86_400_000
    : 0;

  const daysSinceUpdated = (now - new Date(card.updatedAt).getTime()) / 86_400_000;
  const score = card.latestScorePorta;

  // Vermelho: score baixo OU negócio parado há muito tempo
  if ((score !== undefined && score < 40) || (daysSinceMoved > 30 && daysSinceUpdated > 14)) {
    return 'red';
  }

  // Amarelo: score mediano OU negócio sem movimentação recente
  if ((score !== undefined && score < 60) || daysSinceMoved > 15) {
    return 'yellow';
  }

  return 'green';
}

function extractCompanyNameFromSession(session: ChatSession): string {
  if (session.empresaAlvo?.trim()) return session.empresaAlvo.trim();
  if (session.title?.trim()) return session.title.replace(/\.{3}$/, '').trim();
  return 'Empresa sem nome';
}

function normalizeUrl(raw: string): string {
  return raw
    .trim()
    .replace(/[,),]+$/, '')
    .replace(/^<|>$/g, '');
}

function extractFirstUrl(text: string): string | undefined {
  const matches = text.match(/https?:\/\/[^\s)]+/g);
  if (!matches?.length) return undefined;
  return normalizeUrl(matches[0]);
}

function extractExactLinkFromSession(session: ChatSession): string | undefined {
  const text = session.messages.map(m => m.text || '').join('\n');
  const matches = text.match(/https?:\/\/[^\s)]+/g) || [];
  return matches.map(normalizeUrl).find(u => u.includes('app.exactspotter.com'));
}

function extractWebsiteFromSession(session: ChatSession): string | undefined {
  const blob = [session.companyContext || '', session.messages.map(m => m.text || '').join('\n')].join('\n');
  const matches = blob.match(/https?:\/\/[^\s)]+/g) || [];
  const cleaned = matches.map(normalizeUrl);

  const preferred = cleaned.find(u =>
    !u.includes('google.') &&
    !u.includes('brasilapi.com.br') &&
    !u.includes('github.com') &&
    !u.includes('app.exactspotter.com')
  );

  return preferred;
}

function generateBriefDescriptionFromSession(session: ChatSession): string | undefined {
  let text = (session.resumoDossie || '').trim();

  if (!text) {
    const lastBot = [...(session.messages || [])]
      .reverse()
      .find(m => m.sender === Sender.Bot && typeof m.text === 'string' && m.text.trim().length > 0);
    text = (lastBot?.text || '').trim();
  }

  if (!text) return undefined;

  text = text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\n+/g, '\n')
    .replace(/^#+\s+/gm, '')
    .replace(/\[(?:web|cite|page|memory|file):\d+\]/g, '')
    .replace(/\bFontes Consultadas\b[\s\S]*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  const max = 260;
  const min = 120;
  if (text.length <= max) return text;

  const slice = text.slice(0, max);
  const dot = slice.indexOf('.', min);
  if (dot !== -1) return slice.slice(0, dot + 1).trim();

  return slice.trim().replace(/[,:;-]\s*$/, '') + '...';
}

export const CRMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cards, setCards] = useState<CRMCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const loadCards = () => {
      try {
        const raw = window.localStorage.getItem(LOCAL_KEY);
        if (raw) {
          const parsed: CRMCard[] = JSON.parse(raw);
          // Recompute health on load
          const withHealth = parsed.map(card => ({
            ...card,
            health: computeHealth(card),
          }));
          setCards(withHealth);
        }
      } catch (err) {
        console.error('Erro ao carregar CRM:', err);
        setError('Falha ao carregar dados do CRM');
      } finally {
        setIsLoading(false);
      }
    };

    loadCards();
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (isLoading) return;
    
    try {
      window.localStorage.setItem(LOCAL_KEY, JSON.stringify(cards));
    } catch (err) {
      console.error('Erro ao salvar CRM:', err);
      setError('Falha ao salvar dados do CRM');
    }
  }, [cards, isLoading]);

  const saveFull = useCallback(async (card: CRMCard) => {
    try {
      await set(`crm_card_${card.id}`, card);
    } catch (err) {
      console.error('Erro ao salvar card no IndexedDB:', err);
    }
  }, []);

  const createCardFromSession = useCallback(async (session: ChatSession): Promise<CRMCard> => {
    const now = new Date().toISOString();
    const id = `crm_${session.id}`;

    const cnpjDigits = session.cnpj ? String(session.cnpj).replace(/\D/g, '') : '';
    const cnpj = cnpjDigits.length === 14 ? cnpjDigits : (session.cnpj || undefined);

    const base: CRMCard = {
      id,
      companyName: extractCompanyNameFromSession(session),
      cnpj: cnpj || undefined,
      cnpjs: cnpj ? [cnpj] : undefined,
      website: extractWebsiteFromSession(session),
      briefDescription: generateBriefDescriptionFromSession(session),
      exactLink: extractExactLinkFromSession(session),
      linkedSessionIds: [session.id],
      stage: 'prospeccao',
      createdAt: now,
      updatedAt: now,
      movedToStageAt: { prospeccao: now },
      stages: {},
      latestScorePorta: session.scoreOportunidade || undefined,
      health: 'green',
      newsRadarEnabled: false,
    };

    setCards(prev => [base, ...prev]);
    await saveFull(base);
    return base;
  }, [saveFull]);

  const createManualCard = useCallback(async (input: {
    companyName: string;
    cnpj?: string;
    website?: string;
    briefDescription?: string;
    stage?: CRMStage;
  }): Promise<CRMCard> => {
    const now = new Date().toISOString();
    const stage: CRMStage = input.stage || 'prospeccao';

    const cleanCnpj = input.cnpj ? String(input.cnpj).replace(/\D/g, '') : undefined;

    const base: CRMCard = {
      id: `crm_manual_${Date.now()}`,
      companyName: input.companyName.trim() || 'Empresa sem nome',
      cnpj: cleanCnpj && cleanCnpj.length === 14 ? cleanCnpj : undefined,
      cnpjs: cleanCnpj && cleanCnpj.length === 14 ? [cleanCnpj] : undefined,
      website: input.website?.trim() || undefined,
      briefDescription: input.briefDescription?.trim() || undefined,
      exactLink: undefined,
      linkedSessionIds: [],
      stage,
      createdAt: now,
      updatedAt: now,
      movedToStageAt: { [stage]: now },
      stages: {},
      latestScorePorta: undefined,
      health: 'green',
      newsRadarEnabled: false,
    };

    setCards(prev => [base, ...prev]);
    await saveFull(base);
    return base;
  }, [saveFull]);

  const updateCard = useCallback(async (card: CRMCard) => {
    const updated: CRMCard = {
      ...card,
      updatedAt: new Date().toISOString(),
      health: computeHealth(card),
    };
    setCards(prev => prev.map(c => (c.id === card.id ? updated : c)));
    await saveFull(updated);
  }, [saveFull]);

  const deleteCard = useCallback(async (cardId: string) => {
    setCards(prev => prev.filter(c => c.id !== cardId));
    try {
      await del(`crm_card_${cardId}`);
    } catch {
      await set(`crm_card_${cardId}`, undefined as unknown as CRMCard);
    }
  }, []);

  const moveCardToStage = useCallback(async (cardId: string, stage: CRMStage) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;
    
    const now = new Date().toISOString();
    const updated: CRMCard = {
      ...card,
      stage,
      movedToStageAt: { ...card.movedToStageAt, [stage]: now },
      updatedAt: now,
      health: computeHealth({ ...card, stage, movedToStageAt: { ...card.movedToStageAt, [stage]: now } }),
    };
    
    setCards(prev => prev.map(c => (c.id === cardId ? updated : c)));
    await saveFull(updated);
  }, [cards, saveFull]);

  const getCardById = useCallback((cardId: string) => {
    return cards.find(c => c.id === cardId);
  }, [cards]);

  const getCardsByStage = useCallback((stage: CRMStage) => {
    return cards.filter(c => c.stage === stage);
  }, [cards]);

  const refreshHealth = useCallback(() => {
    setCards(prev => prev.map(card => ({
      ...card,
      health: computeHealth(card),
    })));
  }, []);

  const value = useMemo(() => ({
    cards,
    isLoading,
    error,
    createCardFromSession,
    createManualCard,
    updateCard,
    deleteCard,
    moveCardToStage,
    getCardById,
    getCardsByStage,
    refreshHealth,
  }), [
    cards,
    isLoading,
    error,
    createCardFromSession,
    createManualCard,
    updateCard,
    deleteCard,
    moveCardToStage,
    getCardById,
    getCardsByStage,
    refreshHealth,
  ]);

  return <CRMContext.Provider value={value}>{children}</CRMContext.Provider>;
};

export const useCRM = (): CRMContextValue => {
  const ctx = useContext(CRMContext);
  if (!ctx) throw new Error('useCRM must be used within CRMProvider');
  return ctx;
};
