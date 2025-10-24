import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getDocumentById } from '@/lib/firestore';
import { User, AuthState } from '@/types';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      loading: true,
      error: null,

      login: async (email: string, password: string) => {
        try {
          set({ loading: true, error: null });

          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const firebaseUser = userCredential.user;

          // Fetch user data from Firestore
          const userData = await getDocumentById<User>('users', firebaseUser.uid);

          if (!userData) {
            throw new Error('User data not found');
          }

          if (!userData.isActive) {
            await firebaseSignOut(auth);
            throw new Error('Your account has been deactivated. Please contact admin.');
          }

          set({ user: userData, loading: false, error: null });
        } catch (error: any) {
          const errorMessage = error.message || 'Failed to login';
          set({ user: null, loading: false, error: errorMessage });
          throw error;
        }
      },

      logout: async () => {
        try {
          await firebaseSignOut(auth);
          set({ user: null, loading: false, error: null });
        } catch (error: any) {
          set({ error: error.message || 'Failed to logout' });
          throw error;
        }
      },

      setUser: (user: User | null) => {
        set({ user, loading: false });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
);

// Initialize auth state listener
export function initializeAuthListener() {
  onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      try {
        const userData = await getDocumentById<User>('users', firebaseUser.uid);
        if (userData && userData.isActive) {
          useAuthStore.setState({ user: userData, loading: false });
        } else {
          useAuthStore.setState({ user: null, loading: false });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        useAuthStore.setState({ user: null, loading: false });
      }
    } else {
      useAuthStore.setState({ user: null, loading: false });
    }
  });
}
