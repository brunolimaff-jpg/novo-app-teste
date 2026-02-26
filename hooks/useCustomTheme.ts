import { useState, useEffect, useCallback, useMemo } from 'react';
import type { CustomTheme } from '../types/features';
import { DEFAULT_THEMES } from '../types/features';

const THEMES_STORAGE_KEY = 'scout360_custom_themes';
const ACTIVE_THEME_KEY = 'scout360_active_theme';

export function useCustomTheme() {
  const [themes, setThemes] = useState<CustomTheme[]>(DEFAULT_THEMES);
  const [activeThemeId, setActiveThemeId] = useState<string>(DEFAULT_THEMES[0].id);
  const [isThemePanelOpen, setIsThemePanelOpen] = useState(false);

  // Load themes from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const savedThemes = localStorage.getItem(THEMES_STORAGE_KEY);
      const savedActive = localStorage.getItem(ACTIVE_THEME_KEY);

      if (savedThemes) {
        const customThemes: CustomTheme[] = JSON.parse(savedThemes);
        // Merge with defaults, keeping custom ones
        setThemes(prev => [
          ...prev.filter(t => t.isDefault),
          ...customThemes.filter(t => !t.isDefault),
        ]);
      }

      if (savedActive) {
        setActiveThemeId(savedActive);
      }
    } catch {
      console.error('Failed to load themes');
    }
  }, []);

  // Save custom themes to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const customThemes = themes.filter(t => !t.isDefault);
    localStorage.setItem(THEMES_STORAGE_KEY, JSON.stringify(customThemes));
  }, [themes]);

  // Save active theme
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ACTIVE_THEME_KEY, activeThemeId);
  }, [activeThemeId]);

  // Apply theme CSS variables
  useEffect(() => {
    const theme = activeTheme;
    if (!theme || typeof document === 'undefined') return;

    const root = document.documentElement;
    
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--scout-${key}`, value);
    });

    root.style.setProperty('--scout-is-dark', theme.isDark ? '1' : '0');
  }, [activeThemeId, themes]);

  const activeTheme = useMemo(() => 
    themes.find(t => t.id === activeThemeId) || DEFAULT_THEMES[0],
    [themes, activeThemeId]
  );

  const customThemes = useMemo(() => 
    themes.filter(t => !t.isDefault),
    [themes]
  );

  const setTheme = useCallback((themeId: string) => {
    if (themes.some(t => t.id === themeId)) {
      setActiveThemeId(themeId);
    }
  }, [themes]);

  const createTheme = useCallback((theme: Omit<CustomTheme, 'id' | 'isDefault'>) => {
    const newTheme: CustomTheme = {
      ...theme,
      id: `custom-${Date.now()}`,
      isDefault: false,
    };

    setThemes(prev => [...prev, newTheme]);
    return newTheme.id;
  }, []);

  const updateTheme = useCallback((themeId: string, updates: Partial<CustomTheme>) => {
    setThemes(prev => prev.map(t => 
      t.id === themeId && !t.isDefault ? { ...t, ...updates } : t
    ));
  }, []);

  const deleteTheme = useCallback((themeId: string) => {
    const theme = themes.find(t => t.id === themeId);
    if (theme?.isDefault) return; // Can't delete default themes

    setThemes(prev => prev.filter(t => t.id !== themeId));
    
    if (activeThemeId === themeId) {
      setActiveThemeId(DEFAULT_THEMES[0].id);
    }
  }, [themes, activeThemeId]);

  const duplicateTheme = useCallback((themeId: string, newName: string) => {
    const theme = themes.find(t => t.id === themeId);
    if (!theme) return;

    const newTheme: CustomTheme = {
      ...theme,
      id: `custom-${Date.now()}`,
      name: newName,
      isDefault: false,
    };

    setThemes(prev => [...prev, newTheme]);
    return newTheme.id;
  }, [themes]);

  const toggleThemePanel = useCallback(() => {
    setIsThemePanelOpen(prev => !prev);
  }, []);

  const isDarkMode = useMemo(() => activeTheme.isDark, [activeTheme]);

  return {
    themes,
    activeTheme,
    activeThemeId,
    customThemes,
    isThemePanelOpen,
    isDarkMode,
    setTheme,
    createTheme,
    updateTheme,
    deleteTheme,
    duplicateTheme,
    toggleThemePanel,
    setIsThemePanelOpen,
  };
}
