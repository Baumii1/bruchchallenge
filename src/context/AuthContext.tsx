
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  isAdmin: boolean;
  login: (password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// For this demo, we'll use a very simple hardcoded password.
// In a real application, this would be handled by a secure backend.
const ADMIN_PASSWORD = "admin"; // Replace with a more complex password if you wish

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  // Check local storage for persisted admin state on mount
  useEffect(() => {
    const persistedIsAdmin = localStorage.getItem('isAdmin');
    if (persistedIsAdmin === 'true') {
      setIsAdmin(true);
    }
  }, []);

  const login = (password: string) => {
    if (password === ADMIN_PASSWORD) {
      setIsAdmin(true);
      localStorage.setItem('isAdmin', 'true');
      return true;
    }
    setIsAdmin(false);
    localStorage.removeItem('isAdmin');
    return false;
  };

  const logout = () => {
    setIsAdmin(false);
    localStorage.removeItem('isAdmin');
    router.push('/'); // Redirect to home on logout
  };

  return (
    <AuthContext.Provider value={{ isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
