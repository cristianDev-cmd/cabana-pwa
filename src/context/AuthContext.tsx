'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

interface User {
  id: string;
  dni: string;
  email: string;
  nombre: string;
  apellido: string;
  telefono: string;
  role: 'cliente' | 'admin';
  avatar_url: string | null;
  saldo?: number;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  dni: string;
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  telefono: string;
  direccion: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

const API_BASE = '/api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const fetchWithAuth = useCallback(async (url: string, options: RequestInit = {}) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> ?? {}),
    };
    if (state.accessToken) {
      headers['Authorization'] = `Bearer ${state.accessToken}`;
    }

    let response = await fetch(url, { ...options, headers });

    // Token expired — try refresh
    if (response.status === 401 && state.accessToken) {
      const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (refreshRes.ok) {
        const { data } = await refreshRes.json();
        setState(prev => ({ ...prev, accessToken: data.accessToken }));
        headers['Authorization'] = `Bearer ${data.accessToken}`;
        response = await fetch(url, { ...options, headers });
      } else {
        setState({ user: null, accessToken: null, isLoading: false, isAuthenticated: false });
        throw new Error('Sesión expirada');
      }
    }
    return response;
  }, [state.accessToken]);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE}/auth/me`);
      if (res.ok) {
        const { data } = await res.json();
        setState(prev => ({ ...prev, user: { ...prev.user, ...data }, isAuthenticated: true, isLoading: false }));
      } else {
        throw new Error('No autenticado');
      }
    } catch {
      setState({ user: null, accessToken: null, isLoading: false, isAuthenticated: false });
    }
  }, [fetchWithAuth]);

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error ?? 'Error al iniciar sesión');

    setState({
      user: json.data.user,
      accessToken: json.data.accessToken,
      isLoading: false,
      isAuthenticated: true,
    });
  };

  const register = async (data: RegisterData) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error ?? 'Error al registrarse');
  };

  const logout = () => {
    setState({ user: null, accessToken: null, isLoading: false, isAuthenticated: false });
    window.location.href = '/login';
  };

  // Try to restore session on mount
  useEffect(() => {
    refreshUser();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
