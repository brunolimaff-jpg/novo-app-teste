import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../services/firebase';
import type { UserId } from '../types';
import { createUserId } from '../types';

interface AuthContextType {
  user: User | null;
  userId: UserId | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  updateName: (name: string) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        setUser(firebaseUser);
        setIsLoading(false);
      },
      (err) => {
        console.error('Auth state error:', err);
        setError('Erro ao verificar autenticação');
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const login = useCallback(async () => {
    if (!auth) {
      setError('Autenticação não disponível');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account',
      });
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error('Login error:', err);
      setError('Falha ao fazer login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    if (!auth) return;

    setIsLoading(true);
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Logout error:', err);
      setError('Falha ao fazer logout');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateName = useCallback(async (name: string) => {
    if (!user) return;

    try {
      await user.updateProfile({ displayName: name });
      // Force refresh
      setUser({ ...user });
    } catch (err) {
      console.error('Update name error:', err);
      setError('Falha ao atualizar nome');
    }
  }, [user]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const userId = useMemo(() => {
    return user?.uid ? createUserId(user.uid) : null;
  }, [user?.uid]);

  const value = useMemo(() => ({
    user,
    userId,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    logout,
    updateName,
    clearError,
  }), [user, userId, isLoading, error, login, logout, updateName, clearError]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
