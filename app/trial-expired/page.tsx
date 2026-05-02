'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function TrialExpiredPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && (user.subscriptionStatus === 'trial' || user.subscriptionStatus === 'active')) {
      router.push('/dashboard');
    }
  }, [user, router]);

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1e', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, fontFamily: "'Inter',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');`}</style>

      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        {/* Logo */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.5px' }}>
            Table<span style={{ color: '#f59e0b' }}>Flow</span>
          </div>
          <div style={{ fontSize: 11, color: '#4b5563', marginTop: 2 }}>by CodeWithBasharat</div>
        </div>

        <div style={{ fontSize: 64, marginBottom: 20 }}>⏰</div>
        <h1 style={{ fontSize: 32, fontWeight: 900, color: '#f8fafc', marginBottom: 12, letterSpacing: '-1px' }}>
          Your Free Trial Has Ended
        </h1>
        <p style={{ color: '#6b7280', fontSize: 15, lineHeight: 1.65, marginBottom: 32 }}>
          Your 7-day free trial for <strong style={{ color: '#f8fafc' }}>{user?.restaurantName}</strong> has expired.
          Upgrade to keep access to all your data, orders, and reports.
        </p>

        <div style={{ background: '#111827', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 16, padding: '24px', marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-around', gap: 16 }}>
            {[['₹999/mo', 'Monthly Plan'], ['₹9,999/yr', 'Annual — Save 17%']].map(([price, label]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#f59e0b' }}>{price}</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        <Link href="/subscribe"
          style={{ display: 'block', padding: '16px', borderRadius: 14, background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#0a0f1e', fontWeight: 900, fontSize: 16, textDecoration: 'none', marginBottom: 14 }}>
          🚀 Upgrade Now — Continue Access
        </Link>

        <button onClick={async () => { await logout(); router.push('/'); }}
          style={{ background: 'transparent', border: 'none', color: '#4b5563', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
          Sign out and return to home
        </button>
      </div>
    </div>
  );
}
