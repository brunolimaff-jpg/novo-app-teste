import { useState, useEffect, useCallback, useMemo } from 'react';
import type { InvestigationTemplate } from '../types/features';
import { DEFAULT_TEMPLATES } from '../types/features';

const CUSTOM_TEMPLATES_KEY = 'scout360_custom_templates';
const TEMPLATE_USAGE_KEY = 'scout360_template_usage';

export function useTemplates() {
  const [templates, setTemplates] = useState<InvestigationTemplate[]>([]);
  const [isTemplatePanelOpen, setIsTemplatePanelOpen] = useState(false);
  const [usageCount, setUsageCount] = useState<Record<string, number>>({});

  // Load templates and usage from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const savedTemplates = localStorage.getItem(CUSTOM_TEMPLATES_KEY);
      const savedUsage = localStorage.getItem(TEMPLATE_USAGE_KEY);

      if (savedTemplates) {
        const custom: InvestigationTemplate[] = JSON.parse(savedTemplates);
        setTemplates([...DEFAULT_TEMPLATES, ...custom]);
      } else {
        setTemplates(DEFAULT_TEMPLATES);
      }

      if (savedUsage) {
        setUsageCount(JSON.parse(savedUsage));
      }
    } catch {
      setTemplates(DEFAULT_TEMPLATES);
    }
  }, []);

  // Save custom templates to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const custom = templates.filter(t => !t.isDefault);
    localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(custom));
  }, [templates]);

  // Save usage count
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TEMPLATE_USAGE_KEY, JSON.stringify(usageCount));
  }, [usageCount]);

  const customTemplates = useMemo(() => 
    templates.filter(t => !t.isDefault),
    [templates]
  );

  const templatesByCategory = useMemo(() => {
    const grouped: Record<string, InvestigationTemplate[]> = {};
    templates.forEach(t => {
      if (!grouped[t.category]) {
        grouped[t.category] = [];
      }
      grouped[t.category].push(t);
    });
    return grouped;
  }, [templates]);

  const getTemplate = useCallback((templateId: string): InvestigationTemplate | undefined => {
    return templates.find(t => t.id === templateId);
  }, [templates]);

  const useTemplate = useCallback((templateId: string): string => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return '';

    // Update usage count
    setUsageCount(prev => ({
      ...prev,
      [templateId]: (prev[templateId] || 0) + 1,
    }));

    // Update template usage count
    setTemplates(prev => prev.map(t => 
      t.id === templateId 
        ? { ...t, usageCount: t.usageCount + 1 }
        : t
    ));

    return template.prompts.join('\n\n');
  }, [templates]);

  const createTemplate = useCallback((
    name: string,
    description: string,
    category: InvestigationTemplate['category'],
    prompts: string[]
  ): string => {
    const newTemplate: InvestigationTemplate = {
      id: `template-${Date.now()}`,
      name,
      description,
      category,
      prompts,
      isDefault: false,
      createdAt: Date.now(),
      usageCount: 0,
    };

    setTemplates(prev => [...prev, newTemplate]);
    return newTemplate.id;
  }, []);

  const updateTemplate = useCallback((
    templateId: string,
    updates: Partial<Omit<InvestigationTemplate, 'id' | 'isDefault' | 'createdAt'>>
  ) => {
    const template = templates.find(t => t.id === templateId);
    if (template?.isDefault) return; // Can't edit default templates

    setTemplates(prev => prev.map(t => 
      t.id === templateId ? { ...t, ...updates } : t
    ));
  }, [templates]);

  const deleteTemplate = useCallback((templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template?.isDefault) return; // Can't delete default templates

    setTemplates(prev => prev.filter(t => t.id !== templateId));
  }, [templates]);

  const duplicateTemplate = useCallback((templateId: string, newName: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    const newTemplate: InvestigationTemplate = {
      ...template,
      id: `template-${Date.now()}`,
      name: newName,
      isDefault: false,
      createdAt: Date.now(),
      usageCount: 0,
    };

    setTemplates(prev => [...prev, newTemplate]);
    return newTemplate.id;
  }, [templates]);

  const getMostUsedTemplates = useCallback((limit: number = 5): InvestigationTemplate[] => {
    return [...templates]
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  }, [templates]);

  const getRecentlyUsedTemplates = useCallback((limit: number = 5): InvestigationTemplate[] => {
    const sortedByUsage = Object.entries(usageCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([id]) => templates.find(t => t.id === id))
      .filter((t): t is InvestigationTemplate => t !== undefined);
    
    return sortedByUsage;
  }, [templates, usageCount]);

  const searchTemplates = useCallback((query: string): InvestigationTemplate[] => {
    const lowerQuery = query.toLowerCase();
    return templates.filter(t =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.category.toLowerCase().includes(lowerQuery)
    );
  }, [templates]);

  const toggleTemplatePanel = useCallback(() => {
    setIsTemplatePanelOpen(prev => !prev);
  }, []);

  const getCategoryLabel = useCallback((category: string): string => {
    const labels: Record<string, string> = {
      qualificação: 'Qualificação',
      dossiê: 'Dossiê',
      'follow-up': 'Follow-up',
      proposta: 'Proposta',
      custom: 'Personalizado',
    };
    return labels[category] || category;
  }, []);

  return {
    templates,
    customTemplates,
    templatesByCategory,
    isTemplatePanelOpen,
    usageCount,
    getTemplate,
    useTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    getMostUsedTemplates,
    getRecentlyUsedTemplates,
    searchTemplates,
    toggleTemplatePanel,
    setIsTemplatePanelOpen,
    getCategoryLabel,
  };
}
