import { useState, useEffect, useCallback, useRef } from 'react';
import type { KeyboardShortcut } from '../types/features';
import { DEFAULT_SHORTCUTS } from '../types/features';

const CUSTOM_SHORTCUTS_KEY = 'scout360_custom_shortcuts';
const CHEAT_SHEET_KEY = 'scout360_cheat_sheet_seen';

export function useAdvancedKeyboard(
  customActions: Record<string, () => void>
) {
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>([]);
  const [isCheatSheetOpen, setIsCheatSheetOpen] = useState(false);
  const [hasSeenCheatSheet, setHasSeenCheatSheet] = useState(true);
  const [isVimMode, setIsVimMode] = useState(false);
  const [vimSequence, setVimSequence] = useState('');
  const sequenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load custom shortcuts and check if user has seen cheat sheet
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem(CUSTOM_SHORTCUTS_KEY);
      const seen = localStorage.getItem(CHEAT_SHEET_KEY);
      
      if (seen) {
        setHasSeenCheatSheet(true);
      } else {
        setHasSeenCheatSheet(false);
        setIsCheatSheetOpen(true);
      }

      // Build shortcuts with actions
      const baseShortcuts = DEFAULT_SHORTCUTS.map(s => ({
        ...s,
        action: customActions[s.id] || (() => {}),
      }));

      if (saved) {
        const custom = JSON.parse(saved);
        // Merge custom shortcuts
        setShortcuts([...baseShortcuts, ...custom]);
      } else {
        setShortcuts(baseShortcuts);
      }
    } catch {
      setShortcuts(DEFAULT_SHORTCUTS.map(s => ({
        ...s,
        action: customActions[s.id] || (() => {}),
      })));
    }
  }, [customActions]);

  // Save cheat sheet seen status
  const markCheatSheetSeen = useCallback(() => {
    setHasSeenCheatSheet(true);
    setIsCheatSheetOpen(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem(CHEAT_SHEET_KEY, 'true');
    }
  }, []);

  // Keyboard event handler
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow Escape even in inputs
        if (event.key !== 'Escape') return;
      }

      // Vim mode handling
      if (isVimMode && !event.ctrlKey && !event.metaKey) {
        handleVimSequence(event.key);
        return;
      }

      // Check for ? to open cheat sheet
      if (event.key === '?' && !event.ctrlKey && !event.shiftKey && !event.altKey && !event.metaKey) {
        event.preventDefault();
        setIsCheatSheetOpen(true);
        return;
      }

      // Find matching shortcut
      const matched = shortcuts.find(s =>
        s.key.toLowerCase() === event.key.toLowerCase() &&
        !!s.ctrl === event.ctrlKey &&
        !!s.shift === event.shiftKey &&
        !!s.alt === event.altKey &&
        !!s.meta === event.metaKey
      );

      if (matched) {
        event.preventDefault();
        matched.action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, isVimMode]);

  // Vim sequence handler
  const handleVimSequence = useCallback((key: string) => {
    setVimSequence(prev => {
      const newSequence = prev + key;

      // Clear sequence after timeout
      if (sequenceTimeoutRef.current) {
        clearTimeout(sequenceTimeoutRef.current);
      }
      sequenceTimeoutRef.current = setTimeout(() => {
        setVimSequence('');
      }, 1000);

      // Handle vim commands
      switch (newSequence) {
        case 'gg':
          window.scrollTo({ top: 0, behavior: 'smooth' });
          setVimSequence('');
          break;
        case 'G':
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
          setVimSequence('');
          break;
        case 'j':
          window.scrollBy({ top: 50, behavior: 'smooth' });
          setVimSequence('');
          break;
        case 'k':
          window.scrollBy({ top: -50, behavior: 'smooth' });
          setVimSequence('');
          break;
        case 'Escape':
          setVimSequence('');
          break;
      }

      return newSequence;
    });
  }, []);

  const toggleVimMode = useCallback(() => {
    setIsVimMode(prev => !prev);
    setVimSequence('');
  }, []);

  const openCheatSheet = useCallback(() => {
    setIsCheatSheetOpen(true);
  }, []);

  const closeCheatSheet = useCallback(() => {
    setIsCheatSheetOpen(false);
  }, []);

  const registerShortcut = useCallback((shortcut: Omit<KeyboardShortcut, 'action'>, action: () => void) => {
    setShortcuts(prev => [...prev, { ...shortcut, action }]);
  }, []);

  const unregisterShortcut = useCallback((id: string) => {
    setShortcuts(prev => prev.filter(s => s.id !== id));
  }, []);

  const shortcutsByCategory = useCallback(() => {
    const categories: Record<string, KeyboardShortcut[]> = {};
    shortcuts.forEach(s => {
      if (!categories[s.category]) {
        categories[s.category] = [];
      }
      categories[s.category].push(s);
    });
    return categories;
  }, [shortcuts]);

  const formatShortcut = useCallback((shortcut: KeyboardShortcut): string => {
    const parts: string[] = [];
    if (shortcut.ctrl) parts.push('Ctrl');
    if (shortcut.shift) parts.push('Shift');
    if (shortcut.alt) parts.push('Alt');
    if (shortcut.meta) parts.push('Cmd');
    parts.push(shortcut.key);
    return parts.join(' + ');
  }, []);

  return {
    shortcuts,
    isCheatSheetOpen,
    hasSeenCheatSheet,
    isVimMode,
    vimSequence,
    shortcutsByCategory: shortcutsByCategory(),
    formatShortcut,
    openCheatSheet,
    closeCheatSheet,
    markCheatSheetSeen,
    toggleVimMode,
    registerShortcut,
    unregisterShortcut,
  };
}
