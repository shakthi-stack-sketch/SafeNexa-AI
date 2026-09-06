'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { UserPublicProfile, UserRole } from '../types';

interface AuthContextType {
  user: UserPublicProfile | null;
  loading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    name: string;
    email: string;
    organization: string;
    role: UserRole;
    password: string;
    confirmPassword: string;
    adminAuthCode?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasRole: (allowedRoles: UserRole[]) => boolean;
  isAdmin: boolean;
  isManager: boolean;
  isOfficer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserPublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string, rememberMe = true) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Authentication failed.' };
      }
      setUser(data.user);
      return { success: true };
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, error: 'Network communication error.' };
    }
  };

  const register = async (formData: {
    name: string;
    email: string;
    organization: string;
    role: UserRole;
    password: string;
    confirmPassword: string;
    adminAuthCode?: string;
  }) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Registration failed.' };
      }
      return { success: true };
    } catch (err) {
      console.error('Registration error:', err);
      return { success: false, error: 'Network communication error.' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      router.push('/login');
      router.refresh();
    }
  };

  const hasRole = useCallback(
    (allowedRoles: UserRole[]): boolean => {
      if (!user) return false;
      return allowedRoles.includes(user.role);
    },
    [user]
  );

  const isAdmin = user?.role === 'Administrator';
  const isManager = user?.role === 'HSE Manager' || isAdmin;
  const isOfficer = user?.role === 'HSE Officer' || isManager || isAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
        hasRole,
        isAdmin,
        isManager,
        isOfficer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
