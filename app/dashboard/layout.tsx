'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isSuperAdmin } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    // Super admin gets their own page
    if (isSuperAdmin) {
      router.push('/super-admin');
      return;
    }

    // Expired subscription
    if (user.subscriptionStatus === 'expired' || user.subscriptionStatus === 'cancelled') {
      router.push('/trial-expired');
      return;
    }
  }, [user, loading, isSuperAdmin, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h18M3 6h18M3 14h12M3 18h8" />
            </svg>
          </div>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto" />
          <p className="mt-2 text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || isSuperAdmin) return null;

  if (user.subscriptionStatus === 'expired' || user.subscriptionStatus === 'cancelled') {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <div className={`flex-shrink-0 transition-all duration-300 ${sidebarOpen ? 'w-60' : 'w-[60px]'}`}>
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Trial Banner */}
        {user.subscriptionStatus === 'trial' && user.trialDaysRemaining <= 3 && (
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-2" style={{ background: 'rgba(245,158,11,0.08)', borderBottom: '1px solid rgba(245,158,11,0.2)' }}>
            <div className="flex items-center gap-2 text-xs font-medium" style={{ color: '#d97706' }}>
              <span className="animate-pulse">⏰</span>
              <span>Your free trial ends in <strong>{user.trialDaysRemaining} day{user.trialDaysRemaining !== 1 ? 's' : ''}</strong> — subscribe to keep access.</span>
            </div>
            <Link href="/subscribe" className="text-xs font-bold px-3 py-1 rounded-full transition-colors" style={{ background: '#f59e0b', color: '#0f172a' }}>
              Upgrade Now →
            </Link>
          </div>
        )}

        {/* Header */}
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} isSidebarOpen={sidebarOpen} />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4">
          {children}
        </main>
      </div>
    </div>
  );
}
