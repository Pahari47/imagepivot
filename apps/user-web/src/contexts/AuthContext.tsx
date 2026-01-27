'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiClient } from '../lib/api/client';

interface User {
  id: string;
  email: string;
  name: string | null;
  provider: 'EMAIL' | 'GOOGLE' | 'FACEBOOK';
  emailVerified: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const response = await apiClient.getCurrentUser();
      if (response.success && response.data?.data?.user) {
        setUser(response.data.data.user);
      } else {
        setUser(null);
        apiClient.removeToken();
      }
    } catch (error) {
      setUser(null);
      apiClient.removeToken();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.login({ email, password });
      if (response.success && response.data?.data?.token) {
        const token = response.data.data.token;
        apiClient.setToken(token);
        await refreshUser();
        return { success: true };
      }
      return { success: false, error: response.error || 'Login failed' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  };

  const register = async (email: string, password: string, name?: string) => {
    try {
      const response = await apiClient.register({ email, password, name });
      if (response.success && response.data?.data?.token) {
        const token = response.data.data.token;
        apiClient.setToken(token);
        await refreshUser();
        return { success: true };
      }
      return { success: false, error: response.error || 'Registration failed' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      };
    }
  };

  const logout = () => {
    apiClient.removeToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // During SSR or before AuthProvider is mounted, return a safe default
    if (typeof window === 'undefined') {
      return {
        user: null,
        loading: true,
        login: async () => ({ success: false, error: 'Not available during SSR' }),
        register: async () => ({ success: false, error: 'Not available during SSR' }),
        logout: () => {},
        refreshUser: async () => {},
      };
    }
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

