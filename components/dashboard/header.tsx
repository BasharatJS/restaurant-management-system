'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface HeaderProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export function Header({ onToggleSidebar, isSidebarOpen }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-20 flex h-[60px] items-center border-b border-gray-100 bg-white/98 backdrop-blur-sm px-4 gap-3 flex-shrink-0">
      {/* Sidebar Toggle */}
      <button
        onClick={onToggleSidebar}
        className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:bg-amber-50 hover:text-amber-600 transition-colors"
        title={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
        </svg>
      </button>

      {/* Restaurant + Welcome */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900 truncate leading-tight">
          Welcome back, {user?.name}!
        </p>
        <p className="text-xs text-gray-400 truncate leading-none mt-0.5">{user?.restaurantName}</p>
      </div>

      {/* Trial Badge */}
      {user?.subscriptionStatus === 'trial' && (
        <Link
          href="/subscribe"
          className="hidden sm:flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full hover:opacity-90 transition-all flex-shrink-0"
          style={{ background: 'rgba(245,158,11,0.12)', color: '#d97706', border: '1px solid rgba(245,158,11,0.3)' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          {user.trialDaysRemaining}d left in trial
        </Link>
      )}

      {/* Active Badge */}
      {user?.subscriptionStatus === 'active' && (
        <span className="hidden sm:flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full flex-shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          Active
        </span>
      )}

      {/* Role Badge */}
      <span className="hidden md:block text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full capitalize flex-shrink-0">
        {user?.role}
      </span>
    </header>
  );
}
