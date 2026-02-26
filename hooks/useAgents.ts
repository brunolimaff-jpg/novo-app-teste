import { useState, useCallback, useEffect, useMemo } from 'react';
import type { Agent, AgentType } from '../types/features';
import { AGENTS } from '../types/features';

const STORAGE_KEY = 'scout360_selected_agent';

export function useAgents() {
  const [selectedAgentId, setSelectedAgentId] = useState<string>('default');
  const [isAgentPanelOpen, setIsAgentPanelOpen] = useState(false);

  // Load saved agent from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && AGENTS.some(a => a.id === saved)) {
      setSelectedAgentId(saved);
    }
  }, []);

  // Save to localStorage when changed
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, selectedAgentId);
  }, [selectedAgentId]);

  const selectedAgent = useMemo(() => 
    AGENTS.find(a => a.id === selectedAgentId) || AGENTS[0],
    [selectedAgentId]
  );

  const availableAgents = useMemo(() => 
    AGENTS.filter(a => a.isActive),
    []
  );

  const selectAgent = useCallback((agentId: string) => {
    if (AGENTS.some(a => a.id === agentId)) {
      setSelectedAgentId(agentId);
    }
  }, []);

  const selectAgentByType = useCallback((type: AgentType) => {
    const agent = AGENTS.find(a => a.type === type && a.isActive);
    if (agent) {
      setSelectedAgentId(agent.id);
    }
  }, []);

  const toggleAgentPanel = useCallback(() => {
    setIsAgentPanelOpen(prev => !prev);
  }, []);

  const getAgentSystemPrompt = useCallback((basePrompt: string): string => {
    return `${selectedAgent.systemPrompt}\n\n${basePrompt}`;
  }, [selectedAgent]);

  return {
    selectedAgent,
    selectedAgentId,
    availableAgents,
    isAgentPanelOpen,
    selectAgent,
    selectAgentByType,
    toggleAgentPanel,
    setIsAgentPanelOpen,
    getAgentSystemPrompt,
  };
}
