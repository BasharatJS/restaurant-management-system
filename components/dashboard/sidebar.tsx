'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', roles: ['admin', 'waiter', 'kitchen'], icon: <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
  { name: 'Orders', href: '/dashboard/orders', roles: ['admin', 'waiter'], icon: <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> },
  { name: 'Kitchen Display', href: '/dashboard/orders/kitchen', roles: ['admin', 'kitchen'], icon: <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg> },
  { name: 'Tables', href: '/dashboard/tables', roles: ['admin', 'waiter'], icon: <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> },
  { name: 'Menu', href: '/dashboard/menu', roles: ['admin'], icon: <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg> },
  { name: 'Billing', href: '/dashboard/billing', roles: ['admin', 'waiter'], icon: <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" /></svg> },
  { name: 'Customers', href: '/dashboard/customers', roles: ['admin', 'waiter'], icon: <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg> },
  { name: 'Expenses', href: '/dashboard/expenses', roles: ['admin'], icon: <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  { name: 'Staff', href: '/dashboard/staff', roles: ['admin'], icon: <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
  { name: 'Inventory', href: '/dashboard/inventory', roles: ['admin'], icon: <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> },
  { name: 'Reports', href: '/dashboard/reports', roles: ['admin'], icon: <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
  { name: 'Settings', href: '/dashboard/settings', roles: ['admin'], icon: <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
]

// ─── Brand colors (Amber Gold + Dark Slate) ──────────────────────────────────
const AMBER = '#f59e0b'
const AMBER_DIM = 'rgba(245,158,11,0.15)'

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const router = useRouter()

  const filteredNavigation = navigation.filter((item) =>
    user ? item.roles.includes(user.role) : false
  )

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  const isTrialExpired =
    user?.subscriptionStatus === 'expired' || user?.subscriptionStatus === 'cancelled'
  const isTrial = user?.subscriptionStatus === 'trial'
  const isActive = user?.subscriptionStatus === 'active'

  return (
    <div
      className={cn(
        'flex h-full flex-col text-white transition-all duration-300',
        isOpen ? 'w-60' : 'w-[60px]'
      )}
      style={{ background: 'linear-gradient(180deg, #0f172a 0%, #111827 100%)' }}
    >
      {/* ── Logo ─────────────────────────────────────────────────── */}
      <div
        className="flex h-[60px] items-center gap-3 overflow-hidden px-3.5 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div
          className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center shadow-lg"
          style={{ background: `linear-gradient(135deg, ${AMBER}, #d97706)` }}
        >
          <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h18M3 6h18M3 14h12M3 18h8" />
          </svg>
        </div>
        {isOpen && (
          <div className="flex-1 min-w-0">
            <h1 className="text-[17px] font-black text-white leading-tight whitespace-nowrap">
              Table<span style={{ color: AMBER }}>Flow</span>
            </h1>
            <p className="text-[10px] text-slate-500 leading-none whitespace-nowrap">by CodeWithBasharat</p>
          </div>
        )}
      </div>

      {/* ── Restaurant Info (no trial badge here) ──────────────── */}
      {isOpen && user && (
        <div className="px-3.5 py-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-[13px] font-bold text-white truncate leading-tight">{user.restaurantName}</p>
          <p className="text-[11px] text-slate-400 capitalize mt-0.5">{user.role}</p>
        </div>
      )}

      {/* ── Navigation ───────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto scrollbar-hide px-2 py-3 space-y-0.5">
        {filteredNavigation.map((item) => {
          let isActiveLink = false
          if (item.href === '/dashboard') { isActiveLink = pathname === '/dashboard' }
          else if (item.href === '/dashboard/orders/kitchen') { isActiveLink = pathname === '/dashboard/orders/kitchen' }
          else if (item.href === '/dashboard/orders') { isActiveLink = pathname === '/dashboard/orders' || (pathname?.startsWith('/dashboard/orders/') && pathname !== '/dashboard/orders/kitchen') }
          else { isActiveLink = pathname?.startsWith(item.href) || false }

          return (
            <Link
              key={item.name}
              href={item.href}
              title={!isOpen ? item.name : undefined}
              className="flex items-center rounded-xl px-2.5 py-2.5 transition-all duration-150 group"
              style={
                isActiveLink
                  ? { background: AMBER_DIM, color: AMBER }
                  : { color: '#94a3b8' }
              }
              onMouseEnter={(e) => {
                if (!isActiveLink) {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'
                  ;(e.currentTarget as HTMLElement).style.color = '#e2e8f0'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActiveLink) {
                  (e.currentTarget as HTMLElement).style.background = 'transparent'
                  ;(e.currentTarget as HTMLElement).style.color = '#94a3b8'
                }
              }}
            >
              <span
                className="flex-shrink-0"
                style={isActiveLink ? { color: AMBER } : {}}
              >
                {item.icon}
              </span>
              {isOpen && (
                <span className="ml-3 text-[13.5px] font-semibold truncate">{item.name}</span>
              )}
              {isOpen && isActiveLink && (
                <span
                  className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: AMBER }}
                />
              )}
            </Link>
          )
        })}
      </nav>

      {/* ── Trial / Subscription banner ──────────────────────────── */}
      {isOpen && user && (
        <div className="px-2.5 pb-2 flex-shrink-0">
          {isTrial && (
            <div
              className="rounded-xl px-3 py-2.5 mb-2"
              style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)' }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold" style={{ color: AMBER }}>⏰ Free Trial</span>
                <span className="text-[11px] font-black" style={{ color: AMBER }}>{user.trialDaysRemaining}d left</span>
              </div>
              <div className="w-full h-1 rounded-full bg-slate-700 mb-2">
                <div
                  className="h-1 rounded-full transition-all"
                  style={{ width: `${(user.trialDaysRemaining / 7) * 100}%`, background: AMBER }}
                />
              </div>
              <Link
                href="/subscribe"
                className="block w-full text-center text-[11px] font-bold py-1.5 rounded-lg transition-all"
                style={{ background: AMBER, color: '#0f172a' }}
              >
                Upgrade Now →
              </Link>
            </div>
          )}

          {isTrialExpired && (
            <div className="rounded-xl px-3 py-2.5 mb-2" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <p className="text-[11px] font-bold text-red-400 mb-1.5">⛔ Trial Expired</p>
              <p className="text-[10px] text-red-300/70 mb-2">Features are disabled. Upgrade to restore access.</p>
              <Link href="/subscribe" className="block w-full text-center text-[11px] font-bold py-1.5 rounded-lg bg-red-500 text-white">
                Subscribe Now →
              </Link>
            </div>
          )}

          {isActive && (
            <div className="rounded-xl px-3 py-2 mb-2 flex items-center gap-2" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
              <span className="text-[11px] font-semibold text-green-400">Active Subscription</span>
            </div>
          )}
        </div>
      )}

      {/* ── Footer: email + logout ────────────────────────────────── */}
      <div
        className="flex-shrink-0 p-2"
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
      >
        {isOpen && user && (
          <p className="text-[10px] text-slate-500 truncate px-2 pb-1">{user.email}</p>
        )}
        <button
          onClick={handleLogout}
          title={!isOpen ? 'Logout' : undefined}
          className="flex items-center gap-3 w-full rounded-xl px-2.5 py-2.5 text-[13px] font-semibold text-slate-400 hover:text-red-400 transition-all"
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
        >
          <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {isOpen && <span>Logout</span>}
        </button>
      </div>
    </div>
  )
}
