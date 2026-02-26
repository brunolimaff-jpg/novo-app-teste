import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import type { UserId } from '../types';
import { createUserId } from '../types';

// Mock user type
interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
}

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

// Mock user for local development
const mockUser: User = {
  uid: 'local-user-' + Math.random().toString(36).substr(2, 9),
  displayName: 'Usuário Local',
  email: 'usuario@local.dev'
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate async login
      await new Promise(resolve => setTimeout(resolve, 500));
      setUser(mockUser);
      localStorage.setItem('auth_user', JSON.stringify(mockUser));
    } catch (err) {
      console.error('Login error:', err);
      setError('Falha ao fazer login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      setUser(null);
      localStorage.removeItem('auth_user');
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
      const updatedUser = { ...user, displayName: name };
      setUser(updatedUser);
      localStorage.setItem('auth_user', JSON.stringify(updatedUser));
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
