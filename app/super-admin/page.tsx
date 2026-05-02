'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface TenantRow {
  id: string;
  restaurantName: string;
  ownerEmail: string;
  ownerName: string;
  subscriptionStatus: string;
  trialDaysRemaining?: number;
  createdAt: any;
  phone?: string;
}

const NAV = [
  { id: 'tenants', label: 'All Tenants', icon: '🏪' },
  { id: 'active', label: 'Active', icon: '✅' },
  { id: 'trial', label: 'On Trial', icon: '⏰' },
  { id: 'expired', label: 'Expired', icon: '⛔' },
];

const AMBER = '#f59e0b';

export default function SuperAdminPage() {
  const { user, isSuperAdmin, logout } = useAuth();
  const router = useRouter();
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeNav, setActiveNav] = useState('tenants');
  const [search, setSearch] = useState('');
  const [sidebarOpen] = useState(true);
  const [disableConfirm, setDisableConfirm] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: '', name: '' });

  useEffect(() => {
    if (!isSuperAdmin) { router.push('/login'); return; }
    loadTenants();
  }, [isSuperAdmin]);

  const loadTenants = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'tenants'));
      const rows: TenantRow[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as TenantRow));
      setTenants(rows);
    } catch (e) {
      toast.error('Failed to load tenants');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (tenantId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'tenants', tenantId), { subscriptionStatus: status });
      await updateDoc(doc(db, 'subscriptions', tenantId), { status });
      setTenants(prev => prev.map(t => t.id === tenantId ? { ...t, subscriptionStatus: status } : t));
      toast.success(`Status updated to ${status}`);
    } catch { toast.error('Update failed'); }
  };

  const filtered = tenants.filter(t => {
    const matchSearch = !search ||
      t.restaurantName?.toLowerCase().includes(search.toLowerCase()) ||
      t.ownerEmail?.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (activeNav === 'active') return t.subscriptionStatus === 'active';
    if (activeNav === 'trial') return t.subscriptionStatus === 'trial';
    if (activeNav === 'expired') return t.subscriptionStatus === 'expired' || t.subscriptionStatus === 'cancelled';
    return true;
  });

  const stats = {
    total: tenants.length,
    active: tenants.filter(t => t.subscriptionStatus === 'active').length,
    trial: tenants.filter(t => t.subscriptionStatus === 'trial').length,
    expired: tenants.filter(t => t.subscriptionStatus === 'expired' || t.subscriptionStatus === 'cancelled').length,
  };

  const statusColor = (s: string) => {
    if (s === 'active') return { bg: 'rgba(34,197,94,0.1)', color: '#22c55e', border: 'rgba(34,197,94,0.3)' };
    if (s === 'trial') return { bg: 'rgba(245,158,11,0.1)', color: AMBER, border: 'rgba(245,158,11,0.3)' };
    return { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'rgba(239,68,68,0.3)' };
  };

  if (!isSuperAdmin) return null;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f1f5f9', fontFamily: "'Inter', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');`}</style>

      <ConfirmDialog
        open={disableConfirm.open}
        title={`Disable ${disableConfirm.name}?`}
        message={`This restaurant will lose access to the platform immediately. Their data will remain safe and can be restored by reactivating.`}
        confirmLabel="Yes, Disable"
        cancelLabel="Keep Active"
        variant="danger"
        onConfirm={() => { updateStatus(disableConfirm.id, 'expired'); setDisableConfirm({ open: false, id: '', name: '' }); }}
        onCancel={() => setDisableConfirm({ open: false, id: '', name: '' })}
      />

      {/* ── SIDEBAR ─────────────────────────────────────── */}
      <aside style={{ width: 240, flexShrink: 0, background: 'linear-gradient(180deg,#0f172a,#111827)', display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Logo */}
        <div style={{ padding: '0 18px', height: 64, display: 'flex', flexDirection: 'column', justifyContent: 'center', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#f8fafc' }}>
            Table<span style={{ color: AMBER }}>Flow</span>
          </div>
          <div style={{ fontSize: 10, color: '#4b5563', fontWeight: 500, marginTop: 2 }}>by CodeWithBasharat</div>
        </div>

        {/* Super Admin badge */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: '5px 12px' }}>
            <span style={{ fontSize: 12 }}>👑</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: AMBER }}>Super Admin</span>
          </div>
          <p style={{ fontSize: 11, color: '#4b5563', marginTop: 6, truncate: true } as any}>{user?.email}</p>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setActiveNav(n.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', fontSize: 13.5, fontWeight: 600, transition: 'all 0.15s',
                background: activeNav === n.id ? 'rgba(245,158,11,0.15)' : 'transparent',
                color: activeNav === n.id ? AMBER : '#6b7280',
              }}
            >
              <span style={{ fontSize: 16 }}>{n.icon}</span>
              {n.label}
              <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 800, color: activeNav === n.id ? AMBER : '#374151' }}>
                {n.id === 'tenants' ? stats.total : n.id === 'active' ? stats.active : n.id === 'trial' ? stats.trial : stats.expired}
              </span>
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <button
            onClick={async () => { await logout(); router.push('/'); }}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', width: '100%', background: 'transparent', color: '#6b7280', fontSize: 13.5, fontWeight: 600, transition: 'all 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'; (e.currentTarget as HTMLElement).style.color = '#ef4444'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#6b7280'; }}
          >
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <header style={{ height: 64, background: '#fff', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16, flexShrink: 0 }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>Super Admin Dashboard</h1>
            <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>Manage all restaurant tenants</p>
          </div>
          <button onClick={loadTenants} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${AMBER}`, background: 'rgba(245,158,11,0.08)', color: AMBER, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            🔄 Refresh
          </button>
        </header>

        <main style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
            {[
              { label: 'Total Restaurants', value: stats.total, icon: '🏪', color: AMBER },
              { label: 'Active Subscriptions', value: stats.active, icon: '✅', color: '#22c55e' },
              { label: 'On Trial', value: stats.trial, icon: '⏰', color: AMBER },
              { label: 'Expired', value: stats.expired, icon: '⛔', color: '#ef4444' },
            ].map(s => (
              <div key={s.label} style={{ background: '#fff', borderRadius: 14, padding: '20px 18px', border: '1px solid #e5e7eb', borderLeft: `4px solid ${s.color}` }}>
                <div style={{ fontSize: 24 }}>{s.icon}</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', marginTop: 6 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Search */}
          <div style={{ marginBottom: 16 }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by restaurant name or email..."
              style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 13, outline: 'none', width: '100%', maxWidth: 400, background: '#fff' }}
            />
          </div>

          {/* Table */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                  {['Restaurant', 'Owner', 'Status', 'Trial Days', 'Joined', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>Loading tenants...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>No tenants found</td></tr>
                ) : filtered.map(t => {
                  const sc = statusColor(t.subscriptionStatus);
                  return (
                    <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#fafafa'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#fff'}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{t.restaurantName || '—'}</div>
                        {t.phone && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{t.phone}</div>}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontSize: 13, color: '#374151' }}>{t.ownerName || '—'}</div>
                        <div style={{ fontSize: 12, color: '#9ca3af' }}>{t.ownerEmail}</div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ padding: '4px 12px', borderRadius: 100, fontSize: 12, fontWeight: 700, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                          {t.subscriptionStatus}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: '#374151' }}>
                        {t.subscriptionStatus === 'trial' ? `${t.trialDaysRemaining ?? '—'}d` : '—'}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 12, color: '#9ca3af' }}>
                        {t.createdAt?.seconds ? new Date(t.createdAt.seconds * 1000).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {t.subscriptionStatus !== 'active' && (
                            <button onClick={() => updateStatus(t.id, 'active')} style={{ padding: '5px 12px', borderRadius: 7, border: 'none', background: 'rgba(34,197,94,0.1)', color: '#16a34a', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                              Activate
                            </button>
                          )}
                          {t.subscriptionStatus !== 'trial' && (
                            <button onClick={() => updateStatus(t.id, 'trial')} style={{ padding: '5px 12px', borderRadius: 7, border: 'none', background: 'rgba(245,158,11,0.1)', color: '#d97706', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                              Reset Trial
                            </button>
                          )}
                          {t.subscriptionStatus !== 'expired' && (
                            <button onClick={() => setDisableConfirm({ open: true, id: t.id, name: t.restaurantName })} style={{ padding: '5px 12px', borderRadius: 7, border: 'none', background: 'rgba(239,68,68,0.1)', color: '#dc2626', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                              Disable
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
