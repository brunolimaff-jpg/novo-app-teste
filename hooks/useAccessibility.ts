import { useState, useEffect, useCallback, useMemo } from 'react';
import type { AccessibilitySettings } from '../types/features';
import { DEFAULT_ACCESSIBILITY } from '../types/features';

const ACCESSIBILITY_KEY = 'scout360_accessibility_settings';

export function useAccessibility() {
  const [settings, setSettings] = useState<AccessibilitySettings>(DEFAULT_ACCESSIBILITY);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem(ACCESSIBILITY_KEY);
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    } catch {
      console.error('Failed to load accessibility settings');
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ACCESSIBILITY_KEY, JSON.stringify(settings));
  }, [settings]);

  // Apply settings to document
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;

    // High contrast
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Reduce motion
    if (settings.reduceMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    // Large text
    if (settings.largeText) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }

    // Screen reader optimized
    if (settings.screenReaderOptimized) {
      root.classList.add('screen-reader');
    } else {
      root.classList.remove('screen-reader');
    }

    // Focus indicator
    root.classList.remove('focus-default', 'focus-enhanced', 'focus-hidden');
    root.classList.add(`focus-${settings.focusIndicator}`);

    // Color blind mode
    root.classList.remove('deuteranopia', 'protanopia', 'tritanopia');
    if (settings.colorBlindMode !== 'none') {
      root.classList.add(settings.colorBlindMode);
    }
  }, [settings]);

  const updateSetting = useCallback(<K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const toggleHighContrast = useCallback(() => {
    setSettings(prev => ({ ...prev, highContrast: !prev.highContrast }));
  }, []);

  const toggleReduceMotion = useCallback(() => {
    setSettings(prev => ({ ...prev, reduceMotion: !prev.reduceMotion }));
  }, []);

  const toggleLargeText = useCallback(() => {
    setSettings(prev => ({ ...prev, largeText: !prev.largeText }));
  }, []);

  const toggleScreenReaderOptimized = useCallback(() => {
    setSettings(prev => ({ ...prev, screenReaderOptimized: !prev.screenReaderOptimized }));
  }, []);

  const toggleKeyboardOnly = useCallback(() => {
    setSettings(prev => ({ ...prev, keyboardOnly: !prev.keyboardOnly }));
  }, []);

  const setFocusIndicator = useCallback((indicator: AccessibilitySettings['focusIndicator']) => {
    setSettings(prev => ({ ...prev, focusIndicator: indicator }));
  }, []);

  const setColorBlindMode = useCallback((mode: AccessibilitySettings['colorBlindMode']) => {
    setSettings(prev => ({ ...prev, colorBlindMode: mode }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_ACCESSIBILITY);
  }, []);

  const togglePanel = useCallback(() => {
    setIsPanelOpen(prev => !prev);
  }, []);

  const announceToScreenReader = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (typeof document === 'undefined') return;

    const announcer = document.getElementById('sr-announcer');
    if (announcer) {
      announcer.setAttribute('aria-live', priority);
      announcer.textContent = message;
      
      // Clear after announcement
      setTimeout(() => {
        announcer.textContent = '';
      }, 1000);
    }
  }, []);

  // Skip link functionality
  const skipToContent = useCallback(() => {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Trap focus within modal
  const trapFocus = useCallback((containerElement: HTMLElement) => {
    const focusableElements = containerElement.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    containerElement.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      containerElement.removeEventListener('keydown', handleTabKey);
    };
  }, []);

  const cssClasses = useMemo(() => {
    const classes: string[] = [];
    if (settings.highContrast) classes.push('high-contrast');
    if (settings.reduceMotion) classes.push('reduce-motion');
    if (settings.largeText) classes.push('large-text');
    if (settings.screenReaderOptimized) classes.push('screen-reader');
    if (settings.keyboardOnly) classes.push('keyboard-only');
    classes.push(`focus-${settings.focusIndicator}`);
    if (settings.colorBlindMode !== 'none') classes.push(settings.colorBlindMode);
    return classes.join(' ');
  }, [settings]);

  return {
    settings,
    isPanelOpen,
    cssClasses,
    updateSetting,
    toggleHighContrast,
    toggleReduceMotion,
    toggleLargeText,
    toggleScreenReaderOptimized,
    toggleKeyboardOnly,
    setFocusIndicator,
    setColorBlindMode,
    resetSettings,
    togglePanel,
    setIsPanelOpen,
    announceToScreenReader,
    skipToContent,
    trapFocus,
  };
}
