'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user, isSuperAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      if (isSuperAdmin) router.push('/super-admin');
      else router.push('/dashboard');
    }
  }, [user, isSuperAdmin, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please enter your email and password'); return; }
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0a0f1e 0%,#111827 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: "'Inter',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');`}</style>

      {/* Ambient glow */}
      <div style={{ position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 500, height: 400, background: 'radial-gradient(circle,rgba(245,158,11,0.08) 0%,transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#f8fafc', letterSpacing: '-1px' }}>
              Table<span style={{ color: '#f59e0b' }}>Flow</span>
            </div>
            <div style={{ fontSize: 11, color: '#4b5563', marginTop: 2 }}>by CodeWithBasharat</div>
          </Link>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f8fafc', marginTop: 20 }}>Sign in to your dashboard</h1>
          <p style={{ color: '#6b7280', fontSize: 14, marginTop: 6 }}>Welcome back! Enter your credentials below.</p>
        </div>

        <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '36px 32px', boxShadow: '0 25px 60px rgba(0,0,0,0.4)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#9ca3af', marginBottom: 8 }}>Email Address</label>
              <input
                id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@restaurant.com" disabled={loading}
                style={{ width: '100%', padding: '13px 16px', background: '#0f172a', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#f8fafc', fontSize: 14, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                onFocus={e => (e.target.style.borderColor = '#f59e0b')}
                onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#9ca3af', marginBottom: 8 }}>Password</label>
              <input
                id="password" type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Your password" disabled={loading}
                style={{ width: '100%', padding: '13px 16px', background: '#0f172a', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#f8fafc', fontSize: 14, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                onFocus={e => (e.target.style.borderColor = '#f59e0b')}
                onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
              />
            </div>

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#f87171' }}>
                ⚠️ {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{ padding: '14px', borderRadius: 12, background: loading ? 'rgba(245,158,11,0.5)' : 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#0a0f1e', fontWeight: 900, fontSize: 16, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', marginTop: 4 }}>
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: 24, paddingTop: 20, textAlign: 'center' }}>
            <p style={{ color: '#6b7280', fontSize: 14 }}>
              Don't have an account?{' '}
              <Link href="/signup" style={{ color: '#f59e0b', fontWeight: 800, textDecoration: 'none' }}>
                Start Free Trial →
              </Link>
            </p>
          </div>
        </div>

        <p style={{ textAlign: 'center', color: '#374151', fontSize: 12, marginTop: 20 }}>
          Restaurant Management, Reimagined ·{' '}
          <Link href="/" style={{ color: '#f59e0b', textDecoration: 'none' }}>TableFlow</Link>
        </p>
      </div>
    </div>
  );
}
