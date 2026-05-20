'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export type UserRole = 'DIRECTIVO' | 'SECRETARIO' | 'PRECEPTOR' | 'DOCENTE' | 'FAMILIA';

export interface UserProfile {
  id: string;
  name: string;
  lastName: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<UserProfile>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Restaurar sesión desde LocalStorage al iniciar
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser) as UserProfile;
          setToken(storedToken);
          setUser(parsedUser);

          // Verificar validez del token con el backend
          const res = await fetch(`${API_URL}/auth/me`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${storedToken}`,
            },
          });

          if (res.ok) {
            const data = await res.json();
            // Si el backend responde exitoso, el token es válido.
            // Actualizamos el usuario con los últimos datos si es necesario (el endpoint de /me devuelve { user: { id, role } })
            if (data.user) {
              const updatedUser = {
                ...parsedUser,
                id: data.user.id,
                role: data.user.role
              };
              setUser(updatedUser);
              localStorage.setItem('user', JSON.stringify(updatedUser));
            }
          } else {
            // Token expirado o inválido
            logout();
          }
        }
      } catch (err) {
        console.error('Error restaurando la sesión:', err);
        logout();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<UserProfile> => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Credenciales inválidas');
      }

      const { token: userToken, user: userProfile } = data;

      // Guardar en estado
      setToken(userToken);
      setUser(userProfile);
      setError(null);

      // Guardar en localStorage
      localStorage.setItem('token', userToken);
      localStorage.setItem('user', JSON.stringify(userProfile));

      return userProfile as UserProfile;
    } catch (err: any) {
      const errMsg = err.message || 'Error de conexión con el servidor';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setError(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const clearError = () => setError(null);

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        loading,
        error,
        login,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
}
