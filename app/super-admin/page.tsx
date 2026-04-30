'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Tenant, Subscription, SubscriptionStatus } from '@/types';
import { SubscriptionService } from '@/lib/tenant';

interface TenantRow { tenant: Tenant; subscription: Subscription | null; }

const STATUS_COLORS: Record<SubscriptionStatus, string> = {
  trial: 'bg-blue-100 text-blue-700',
  active: 'bg-green-100 text-green-700',
  expired: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-600',
};

export default function SuperAdminPage() {
  const { user, isSuperAdmin, logout } = useAuth();
  const router = useRouter();
  const [rows, setRows] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | SubscriptionStatus>('all');

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (!isSuperAdmin) { router.push('/dashboard'); }
  }, [user, isSuperAdmin, router]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tenantsSnap, subsSnap] = await Promise.all([
        getDocs(collection(db, 'tenants')),
        getDocs(collection(db, 'subscriptions')),
      ]);
      const subMap = new Map<string, Subscription>();
      subsSnap.docs.forEach((d) => { const sub = { id: d.id, ...d.data() } as Subscription; subMap.set(sub.tenantId, sub); });
      const tenantRows: TenantRow[] = tenantsSnap.docs.map((d) => ({ tenant: { id: d.id, ...d.data() } as Tenant, subscription: subMap.get(d.id) ?? null }));
      tenantRows.sort((a, b) => {
        const order: Record<string, number> = { expired: 0, trial: 1, cancelled: 2, active: 3 };
        return (order[a.subscription?.status ?? 'expired'] ?? 0) - (order[b.subscription?.status ?? 'expired'] ?? 0);
      });
      setRows(tenantRows);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (isSuperAdmin) fetchData(); }, [isSuperAdmin, fetchData]);

  const activateSubscription = async (tenantId: string, plan: 'monthly' | 'annual') => {
    setActivating(tenantId);
    try {
      await SubscriptionService.manuallyActivate({ tenantId, plan });
      await fetchData();
    } finally { setActivating(null); }
  };

  const deactivate = async (tenantId: string) => {
    setActivating(tenantId);
    try {
      await SubscriptionService.deactivate(tenantId);
      await fetchData();
    } finally { setActivating(null); }
  };

  const stats = {
    total: rows.length,
    trial: rows.filter((r) => r.subscription?.status === 'trial').length,
    active: rows.filter((r) => r.subscription?.status === 'active').length,
    expired: rows.filter((r) => r.subscription?.status === 'expired').length,
    revenue: rows.filter((r) => r.subscription?.status === 'active').reduce((sum, r) => {
      if (r.subscription?.plan === 'annual') return sum + 9999;
      return sum + 999;
    }, 0),
  };

  const filtered = filter === 'all' ? rows : rows.filter((r) => r.subscription?.status === filter);
  if (!isSuperAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');`}</style>

      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h18M3 6h18M3 14h12M3 18h8" /></svg>
          </div>
          <div>
            <span className="text-white font-black text-lg">TableFlow</span>
            <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">SUPER ADMIN</span>
          </div>
        </div>
        <button onClick={logout} className="text-sm text-gray-400 hover:text-red-400 transition-colors font-semibold">Logout →</button>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Total Restaurants', value: stats.total, icon: '🏪', color: 'text-white' },
            { label: 'In Trial', value: stats.trial, icon: '⏰', color: 'text-blue-400' },
            { label: 'Active', value: stats.active, icon: '✅', color: 'text-green-400' },
            { label: 'Expired', value: stats.expired, icon: '❌', color: 'text-red-400' },
            { label: 'Est. Revenue', value: `₹${stats.revenue.toLocaleString()}`, icon: '💰', color: 'text-indigo-400' },
          ].map((stat, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
              <div className="text-gray-500 text-xs mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-white">All Restaurants</h2>
          <div className="flex gap-2">
            {(['all', 'trial', 'active', 'expired'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-colors ${filter === f ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>{f}</button>
            ))}
            <button onClick={fetchData} className="px-4 py-2 rounded-lg text-xs font-bold bg-gray-800 text-gray-400 hover:bg-gray-700 transition-colors">🔄 Refresh</button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-20 text-gray-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4" />
            Loading restaurants...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-500">No restaurants found</div>
        ) : (
          <div className="space-y-3">
            {filtered.map(({ tenant, subscription }) => {
              const status = subscription?.status ?? 'expired';
              const trialEnd = subscription?.trialEndDate?.toDate();
              const subEnd = subscription?.subscriptionEndDate?.toDate();
              const isExpiring = status === 'trial' && trialEnd && trialEnd.getTime() - Date.now() < 2 * 24 * 60 * 60 * 1000;
              return (
                <div key={tenant.id} className={`bg-gray-900 border rounded-2xl p-6 ${isExpiring ? 'border-red-500/50' : 'border-gray-800'}`}>
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-white font-bold text-lg">{tenant.restaurantName}</h3>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full capitalize ${STATUS_COLORS[status as SubscriptionStatus]}`}>{status}</span>
                        {isExpiring && <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-500/20 text-red-400 animate-pulse">⚠️ Expiring Soon</span>}
                      </div>
                      <p className="text-gray-400 text-sm">👤 {tenant.ownerName} · 📧 {tenant.ownerEmail}</p>
                      <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500">
                        <span>🆔 {tenant.id?.slice(0, 8)}...</span>
                        {subscription?.plan && <span className="capitalize">📦 Plan: <strong className="text-gray-300">{subscription.plan}</strong></span>}
                        {status === 'trial' && trialEnd && <span>Trial ends: <strong className="text-blue-400">{trialEnd.toLocaleDateString('en-IN')}</strong></span>}
                        {status === 'active' && subEnd && <span>Renews: <strong className="text-green-400">{subEnd.toLocaleDateString('en-IN')}</strong></span>}
                        {tenant.createdAt && <span>Joined: {tenant.createdAt.toDate().toLocaleDateString('en-IN')}</span>}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {status !== 'active' && (
                        <>
                          <button onClick={() => activateSubscription(tenant.id!, 'monthly')} disabled={activating === tenant.id} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50">
                            {activating === tenant.id ? '...' : '✅ Activate Monthly'}
                          </button>
                          <button onClick={() => activateSubscription(tenant.id!, 'annual')} disabled={activating === tenant.id} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50">
                            {activating === tenant.id ? '...' : '🔥 Activate Annual'}
                          </button>
                        </>
                      )}
                      {status === 'active' && (
                        <button onClick={() => deactivate(tenant.id!)} disabled={activating === tenant.id} className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50">
                          {activating === tenant.id ? '...' : '❌ Deactivate'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
