"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, type User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { getFirebaseAuthClient, isAdminEmail, isFirebaseConfigured } from '@/lib/firebase-client';

interface AuthContextType {
  isAdmin: boolean;
  isAuthReady: boolean;
  authEnabled: boolean;
  adminEmail: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  authError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const router = useRouter();

  const authEnabled = isFirebaseConfigured();

  useEffect(() => {
    const auth = getFirebaseAuthClient();

    if (!auth) {
      setIsAuthReady(true);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const auth = getFirebaseAuthClient();

    if (!auth) {
      setAuthError('Firebase Auth ist nicht konfiguriert. Trage zuerst die Umgebungsvariablen ein.');
      return false;
    }

    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);

      if (!isAdminEmail(credential.user.email)) {
        await signOut(auth);
        setUser(null);
        setAuthError('Dieses Konto ist nicht als Admin freigeschaltet.');
        return false;
      }

      setAuthError(null);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unbekannter Login-Fehler.';
      setAuthError(message);
      return false;
    }
  };

  const logout = async () => {
    const auth = getFirebaseAuthClient();

    if (auth) {
      await signOut(auth);
    }

    setUser(null);
    router.push('/');
  };

  const value = useMemo<AuthContextType>(() => ({
    isAdmin: isAdminEmail(user?.email),
    isAuthReady,
    authEnabled,
    adminEmail: user?.email ?? null,
    login,
    logout,
    authError,
  }), [authEnabled, authError, isAuthReady, user]);

  return (
    <AuthContext.Provider value={value}>
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
