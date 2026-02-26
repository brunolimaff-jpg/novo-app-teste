import { useState, useEffect, useCallback } from 'react';
import type { SharedSession } from '../types/features';
import type { ChatSession } from '../types';

const SHARED_SESSIONS_KEY = 'scout360_shared_sessions';

// Simple encryption using XOR (for demo purposes - not secure for production)
function encryptData(data: string, password: string): string {
  let result = '';
  for (let i = 0; i < data.length; i++) {
    result += String.fromCharCode(
      data.charCodeAt(i) ^ password.charCodeAt(i % password.length)
    );
  }
  return btoa(result);
}

function decryptData(encrypted: string, password: string): string {
  try {
    const data = atob(encrypted);
    let result = '';
    for (let i = 0; i < data.length; i++) {
      result += String.fromCharCode(
        data.charCodeAt(i) ^ password.charCodeAt(i % password.length)
      );
    }
    return result;
  } catch {
    throw new Error('Invalid password or corrupted data');
  }
}

function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

export function useSessionSharing(userId?: string) {
  const [sharedSessions, setSharedSessions] = useState<SharedSession[]>([]);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareLink, setShareLink] = useState<string>('');
  const [sharePassword, setSharePassword] = useState<string>('');
  const [shareExpiry, setShareExpiry] = useState<number>(7); // days
  const [maxViews, setMaxViews] = useState<number | undefined>(undefined);

  // Load shared sessions from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem(SHARED_SESSIONS_KEY);
      if (saved) {
        const parsed: SharedSession[] = JSON.parse(saved);
        // Filter out expired sessions
        const now = Date.now();
        const valid = parsed.filter(s => s.expiresAt > now);
        setSharedSessions(valid);
      }
    } catch {
      console.error('Failed to load shared sessions');
    }
  }, []);

  // Save shared sessions to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SHARED_SESSIONS_KEY, JSON.stringify(sharedSessions));
  }, [sharedSessions]);

  const createShareLink = useCallback((
    session: ChatSession,
    password?: string,
    expiryDays: number = 7,
    maxViewsLimit?: number
  ): string => {
    const sessionData = JSON.stringify(session);
    const encryptedData = password 
      ? encryptData(sessionData, password)
      : btoa(sessionData);

    const sharedSession: SharedSession = {
      id: `share-${Date.now()}`,
      sessionId: session.id,
      encryptedData,
      passwordHash: password ? hashPassword(password) : undefined,
      expiresAt: Date.now() + (expiryDays * 24 * 60 * 60 * 1000),
      viewCount: 0,
      maxViews: maxViewsLimit,
      createdAt: Date.now(),
      createdBy: userId || 'anonymous',
    };

    setSharedSessions(prev => [...prev, sharedSession]);

    // Generate shareable link
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/share/${sharedSession.id}`;
    setShareLink(link);

    return link;
  }, [userId]);

  const getSharedSession = useCallback((shareId: string, password?: string): ChatSession | null => {
    const shared = sharedSessions.find(s => s.id === shareId);
    if (!shared) return null;

    // Check expiry
    if (shared.expiresAt < Date.now()) {
      return null;
    }

    // Check max views
    if (shared.maxViews && shared.viewCount >= shared.maxViews) {
      return null;
    }

    // Verify password if required
    if (shared.passwordHash && password) {
      if (hashPassword(password) !== shared.passwordHash) {
        throw new Error('Invalid password');
      }
    }

    // Decrypt and return session
    try {
      const decrypted = password 
        ? decryptData(shared.encryptedData, password)
        : atob(shared.encryptedData);
      
      // Increment view count
      setSharedSessions(prev => prev.map(s => 
        s.id === shareId 
          ? { ...s, viewCount: s.viewCount + 1 }
          : s
      ));

      return JSON.parse(decrypted);
    } catch {
      throw new Error('Failed to decrypt session');
    }
  }, [sharedSessions]);

  const revokeShareLink = useCallback((shareId: string) => {
    setSharedSessions(prev => prev.filter(s => s.id !== shareId));
  }, []);

  const copyShareLink = useCallback(async (): Promise<boolean> => {
    if (!shareLink) return false;
    
    try {
      await navigator.clipboard.writeText(shareLink);
      return true;
    } catch {
      return false;
    }
  }, [shareLink]);

  const openShareModal = useCallback(() => {
    setIsShareModalOpen(true);
    setShareLink('');
    setSharePassword('');
    setShareExpiry(7);
    setMaxViews(undefined);
  }, []);

  const closeShareModal = useCallback(() => {
    setIsShareModalOpen(false);
  }, []);

  const getUserSharedSessions = useCallback(() => {
    if (!userId) return [];
    return sharedSessions.filter(s => s.createdBy === userId);
  }, [sharedSessions, userId]);

  const getShareStats = useCallback((shareId: string) => {
    const shared = sharedSessions.find(s => s.id === shareId);
    if (!shared) return null;

    return {
      viewCount: shared.viewCount,
      maxViews: shared.maxViews,
      expiresAt: shared.expiresAt,
      isExpired: shared.expiresAt < Date.now(),
      daysRemaining: Math.ceil((shared.expiresAt - Date.now()) / (24 * 60 * 60 * 1000)),
    };
  }, [sharedSessions]);

  return {
    sharedSessions,
    isShareModalOpen,
    shareLink,
    sharePassword,
    shareExpiry,
    maxViews,
    createShareLink,
    getSharedSession,
    revokeShareLink,
    copyShareLink,
    openShareModal,
    closeShareModal,
    setSharePassword,
    setShareExpiry,
    setMaxViews,
    getUserSharedSessions,
    getShareStats,
  };
}
