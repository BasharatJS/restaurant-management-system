'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [restaurantName, setRestaurantName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { signup, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && success) {
      setTimeout(() => router.push('/dashboard'), 1500);
    }
  }, [user, success, router]);

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantName.trim() || !ownerName.trim()) { setError('Please fill in all fields'); return; }
    setError('');
    setStep(2);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password || !confirmPassword) { setError('Please fill in all fields'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }

    setLoading(true);
    try {
      await signup({ restaurantName, ownerName, email, password });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0a0f1e 0%,#111827 100%)', display: 'flex', flexDirection: 'column', fontFamily: "'Inter',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');`}</style>

      {success && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: '#0a0f1e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontSize: 26, fontWeight: 900, color: '#f8fafc', marginBottom: 8 }}>Welcome to TableFlow!</h2>
            <p style={{ color: '#9ca3af', marginBottom: 8 }}>Your 7-day free trial has started.</p>
            <p style={{ color: '#f59e0b', fontWeight: 700 }}>Setting up your dashboard...</p>
            <div style={{ width: 32, height: 32, border: '3px solid rgba(245,158,11,0.2)', borderTopColor: '#f59e0b', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '16px auto 0' }} />
          </div>
        </div>
      )}

      <nav style={{ padding: '16px 5%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.5px' }}>Table<span style={{ color: '#f59e0b' }}>Flow</span></div>
          <div style={{ fontSize: 10, color: '#4b5563', fontWeight: 500 }}>by CodeWithBasharat</div>
        </Link>
        <Link href="/login" style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', textDecoration: 'none' }}>Already registered? Sign In →</Link>
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 5%' }}>
        <div style={{ width: '100%', maxWidth: 480 }}>
          <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.4)' }}>
            {/* Progress bar */}
            <div style={{ height: 4, background: '#1f2937' }}>
              <div style={{ height: '100%', background: 'linear-gradient(90deg,#f59e0b,#d97706)', transition: 'width 0.5s', width: step === 1 ? '50%' : '100%' }} />
            </div>
            <div style={{ padding: '36px 32px' }}>
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{ width: 60, height: 60, background: 'rgba(245,158,11,0.15)', border: '2px solid rgba(245,158,11,0.4)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28 }}>
                  {step === 1 ? '🍽️' : '🔐'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
                  {[['1. Restaurant', 1], ['2. Account', 2]].map(([label, s]) => (
                    <span key={s as number} style={{ fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 100, background: step >= (s as number) ? '#f59e0b' : 'rgba(255,255,255,0.05)', color: step >= (s as number) ? '#0a0f1e' : '#4b5563' }}>{label}</span>
                  ))}
                </div>
                <h1 style={{ fontSize: 22, fontWeight: 900, color: '#f8fafc' }}>{step === 1 ? 'Tell us about your restaurant' : 'Create your account'}</h1>
                <p style={{ color: '#6b7280', fontSize: 13, marginTop: 6 }}>{step === 1 ? "We'll set up a dedicated dashboard for your restaurant" : '7-day free trial starts immediately — no credit card needed'}</p>
              </div>

              {step === 1 && (
                <form onSubmit={handleStep1} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#9ca3af', marginBottom: 8 }}>🏪 Restaurant Name</label>
                    <input type="text" value={restaurantName} onChange={e => setRestaurantName(e.target.value)} placeholder="e.g. Spice Garden Restaurant" style={{ width: '100%', padding: '12px 14px', background: '#0f172a', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#f8fafc', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#9ca3af', marginBottom: 8 }}>👤 Your Name (Owner / Manager)</label>
                    <input type="text" value={ownerName} onChange={e => setOwnerName(e.target.value)} placeholder="e.g. Mohammed Basharat" style={{ width: '100%', padding: '12px 14px', background: '#0f172a', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#f8fafc', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#f87171' }}>⚠️ {error}</div>}
                  <button type="submit" style={{ padding: '14px', borderRadius: 12, background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#0a0f1e', fontWeight: 900, fontSize: 15, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Continue →</button>
                </form>
              )}

              {step === 2 && (
                <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {[['📧 Email Address', 'email', email, setEmail, 'you@restaurant.com'], ['🔒 Password', 'password', password, setPassword, 'Minimum 6 characters'], ['🔒 Confirm Password', 'password', confirmPassword, setConfirmPassword, 'Re-enter your password']].map(([label, type, val, setter, ph]) => (
                    <div key={label as string}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#9ca3af', marginBottom: 8 }}>{label as string}</label>
                      <input type={type as string} value={val as string} onChange={e => (setter as any)(e.target.value)} placeholder={ph as string} disabled={loading}
                        style={{ width: '100%', padding: '12px 14px', background: '#0f172a', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#f8fafc', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                  ))}
                  <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ fontSize: 22 }}>🎁</span>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 800, color: '#f59e0b' }}>7-Day Free Trial Included!</p>
                      <p style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Full access, no credit card, cancel anytime.</p>
                    </div>
                  </div>
                  {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#f87171' }}>⚠️ {error}</div>}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="button" onClick={() => setStep(1)} disabled={loading} style={{ padding: '12px 20px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#9ca3af', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>
                    <button type="submit" disabled={loading} style={{ flex: 1, padding: '12px', borderRadius: 10, background: loading ? 'rgba(245,158,11,0.4)' : 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#0a0f1e', fontWeight: 900, fontSize: 15, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                      {loading ? 'Creating your restaurant...' : '🚀 Create Account & Start Trial'}
                    </button>
                  </div>
                </form>
              )}

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: 20, paddingTop: 16, textAlign: 'center' }}>
                <p style={{ color: '#4b5563', fontSize: 12 }}>By creating an account you agree to our Terms of Service.</p>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 20, color: '#374151', fontSize: 12 }}>
            <span>🔒 Secure & Encrypted</span><span>🛡️ Data Isolated</span><span>✅ No Hidden Fees</span>
          </div>
        </div>
      </div>
    </div>
  );
}
