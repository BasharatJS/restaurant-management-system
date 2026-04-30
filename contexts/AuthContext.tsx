'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  UserCredential,
} from 'firebase/auth';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { TenantService, SubscriptionService } from '@/lib/tenant';
import { AuthUser, SubscriptionStatus, UserRole } from '@/types';

// ─── Super Admin ──────────────────────────────────────────────────────────────
const SUPER_ADMIN_EMAIL = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || 'mdbasharattaquee@gmail.com';

// ─── Context Types ────────────────────────────────────────────────────────────

interface CreateStaffParams {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isSuperAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (params: { restaurantName: string; ownerName: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  createStaff: (params: CreateStaffParams) => Promise<void>;
  refreshSubscriptionStatus: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  isAdmin: boolean;
  isWaiter: boolean;
  isKitchen: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// ─── Helper: Build AuthUser ───────────────────────────────────────────────────

async function buildAuthUser(
  firebaseUser: User,
  tenantId: string
): Promise<AuthUser | null> {
  try {
    const [tenantUser, subStatus, tenant] = await Promise.all([
      TenantService.getTenantUser(tenantId, firebaseUser.uid),
      SubscriptionService.getSubscriptionStatus(tenantId),
      TenantService.getTenant(tenantId),
    ]);

    if (!tenantUser || !tenantUser.isActive) return null;

    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      name: tenantUser.name,
      restaurantName: tenant?.restaurantName || tenantUser.name,
      restaurantPhone: tenant?.phone || '',
      restaurantAddress: tenant?.address || '',
      restaurantGstin: tenant?.gstin || '',
      restaurantEmail: tenant?.email || '',
      role: tenantUser.role,
      isActive: tenantUser.isActive,
      tenantId,
      subscriptionStatus: subStatus.status,
      trialEndsAt: subStatus.trialEndsAt,
      trialDaysRemaining: subStatus.trialDaysRemaining,
    };
  } catch (err) {
    console.error('buildAuthUser error:', err);
    return null;
  }
}

// ─── Auth Provider ────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Prevent race condition during signup
  const isSigningUp = useRef(false);

  // ── Signup ───────────────────────────────────────────────────────────────
  const signup = async (params: {
    restaurantName: string;
    ownerName: string;
    email: string;
    password: string;
  }) => {
    const { restaurantName, ownerName, email, password } = params;
    isSigningUp.current = true;

    let credential: UserCredential;
    try {
      credential = await createUserWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      isSigningUp.current = false;
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('This email is already registered. Please sign in.');
      }
      throw new Error('Account creation failed. Please try again.');
    }

    try {
      const tenantId = await TenantService.createTenant({
        restaurantName,
        ownerName,
        ownerEmail: email,
        ownerUid: credential.user.uid,
      });

      const authUser = await buildAuthUser(credential.user, tenantId);
      setUser(authUser);
    } catch (err) {
      await credential.user.delete();
      throw new Error('Setup failed — please try again or contact support.');
    } finally {
      isSigningUp.current = false;
    }
  };

  // ── Login ────────────────────────────────────────────────────────────────
  const login = async (email: string, password: string) => {
    let credential: UserCredential;
    try {
      credential = await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      if (
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/invalid-credential'
      ) {
        throw new Error('Invalid email or password.');
      }
      throw new Error('Login failed. Please try again.');
    }

    // Super Admin bypass
    if (credential.user.email === SUPER_ADMIN_EMAIL) {
      setIsSuperAdmin(true);
      setUser({
        uid: credential.user.uid,
        email: credential.user.email!,
        name: 'Super Admin',
        restaurantName: 'TableFlow Admin',
        restaurantPhone: '',
        restaurantAddress: '',
        role: 'admin',
        isActive: true,
        tenantId: 'super-admin',
        subscriptionStatus: 'active',
        trialEndsAt: null,
        trialDaysRemaining: 0,
      });
      return;
    }

    const tenantId = await TenantService.getTenantIdByUid(credential.user.uid);
    if (!tenantId) {
      await signOut(auth);
      throw new Error('Account not found. Please sign up or contact your admin.');
    }

    const authUser = await buildAuthUser(credential.user, tenantId);
    if (!authUser) {
      await signOut(auth);
      throw new Error('Account is deactivated. Please contact your admin.');
    }

    setUser(authUser);
  };

  // ── Logout ───────────────────────────────────────────────────────────────
  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setIsSuperAdmin(false);
  };

  // ── Create Staff (admin directly creates staff accounts) ──────────────
  const createStaff = async (params: CreateStaffParams) => {
    if (!user || user.role !== 'admin') {
      throw new Error('Only admins can create staff accounts.');
    }

    // Use secondary Firebase app to avoid signing out current admin
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    const secondaryApp =
      getApps().find((app: any) => app.name === 'secondary') ||
      initializeApp(firebaseConfig, 'secondary');
    const secondaryAuth = getAuth(secondaryApp);

    let newUid: string;
    try {
      const credential = await createUserWithEmailAndPassword(
        secondaryAuth,
        params.email,
        params.password
      );
      newUid = credential.user.uid;
      await signOut(secondaryAuth);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('This email is already registered.');
      }
      throw new Error('Failed to create account. Please try again.');
    }

    // Create Firestore record
    await TenantService.createStaffUser({
      tenantId: user.tenantId,
      uid: newUid,
      email: params.email,
      name: params.name,
      role: params.role,
      phone: params.phone,
    });
  };

  // ── Refresh Subscription Status ───────────────────────────────────────
  const refreshSubscriptionStatus = async () => {
    if (!user || user.tenantId === 'super-admin') return;
    const subStatus = await SubscriptionService.getSubscriptionStatus(user.tenantId);
    setUser((prev) =>
      prev
        ? {
            ...prev,
            subscriptionStatus: subStatus.status,
            trialEndsAt: subStatus.trialEndsAt,
            trialDaysRemaining: subStatus.trialDaysRemaining,
          }
        : null
    );
  };

  // ── Refresh full user (e.g., after settings update) ──────────────────
  const refreshUser = async () => {
    if (!user || user.tenantId === 'super-admin') return;
    const tenant = await TenantService.getTenant(user.tenantId);
    if (!tenant) return;
    setUser((prev) =>
      prev
        ? {
            ...prev,
            restaurantName: tenant.restaurantName || prev.restaurantName,
            restaurantPhone: tenant.phone || '',
            restaurantAddress: tenant.address || '',
            restaurantGstin: tenant.gstin || '',
            restaurantEmail: tenant.email || '',
          }
        : null
    );
  };

  // ── Auth State Listener ───────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser: User | null) => {
        if (isSigningUp.current) return;

        try {
          if (firebaseUser) {
            // Super Admin
            if (firebaseUser.email === SUPER_ADMIN_EMAIL) {
              setIsSuperAdmin(true);
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email!,
                name: 'Super Admin',
                restaurantName: 'TableFlow Admin',
                restaurantPhone: '',
                restaurantAddress: '',
                role: 'admin',
                isActive: true,
                tenantId: 'super-admin',
                subscriptionStatus: 'active',
                trialEndsAt: null,
                trialDaysRemaining: 0,
              });
              setLoading(false);
              return;
            }

            const tenantId = await TenantService.getTenantIdByUid(firebaseUser.uid);
            if (!tenantId) {
              await signOut(auth);
              setUser(null);
              setLoading(false);
              return;
            }

            const authUser = await buildAuthUser(firebaseUser, tenantId);
            if (!authUser) {
              await signOut(auth);
              setUser(null);
            } else {
              setUser(authUser);
            }
          } else {
            setUser(null);
            setIsSuperAdmin(false);
          }
        } catch (err) {
          console.error('onAuthStateChanged error:', err);
          setUser(null);
        } finally {
          setLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, []);

  const hasRole = (role: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    if (Array.isArray(role)) return role.includes(user.role);
    return user.role === role;
  };

  const value: AuthContextType = {
    user,
    loading,
    isSuperAdmin,
    login,
    signup,
    logout,
    createStaff,
    refreshSubscriptionStatus,
    refreshUser,
    isAuthenticated: !!user,
    hasRole,
    isAdmin: user?.role === 'admin',
    isWaiter: user?.role === 'waiter',
    isKitchen: user?.role === 'kitchen',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
