'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getDocumentById } from '@/lib/firestore';
import { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  isAdmin: boolean;
  isWaiter: boolean;
  isKitchen: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const userData = await getDocumentById<User>('users', firebaseUser.uid);
          if (userData && userData.isActive) {
            setUser(userData);
          } else {
            setUser(null);
            if (userData && !userData.isActive) {
              setError('Your account has been deactivated. Please contact admin.');
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      const userData = await getDocumentById<User>('users', firebaseUser.uid);

      if (!userData) {
        throw new Error('User data not found');
      }

      if (!userData.isActive) {
        await firebaseSignOut(auth);
        throw new Error('Your account has been deactivated. Please contact admin.');
      }

      setUser(userData);
      setLoading(false);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to login';
      setError(errorMessage);
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setError(null);
    } catch (error: any) {
      setError(error.message || 'Failed to logout');
      throw error;
    }
  };

  const hasRole = (role: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return user.role === role;
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!user,
    hasRole,
    isAdmin: user?.role === 'admin',
    isWaiter: user?.role === 'waiter',
    isKitchen: user?.role === 'kitchen',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
