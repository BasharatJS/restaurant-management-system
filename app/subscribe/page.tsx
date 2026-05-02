'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { SubscriptionService } from '@/lib/tenant';

declare global {
  interface Window { Razorpay: any; }
}

const RAZORPAY_KEY = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!;

export default function SubscribePage() {
  const { user, refreshSubscriptionStatus } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState<'monthly' | 'annual' | null>(null);
  const [error, setError] = useState('');

  const handleSubscribe = async (plan: 'monthly' | 'annual') => {
    if (!user) return;
    setError('');
    setLoading(plan);

    try {
      const res = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, tenantId: user.tenantId }),
      });
      const orderData = await res.json();
      if (!res.ok) throw new Error(orderData.error || 'Failed to create order');

      await new Promise<void>((resolve, reject) => {
        if (window.Razorpay) { resolve(); return; }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Razorpay'));
        document.body.appendChild(script);
      });

      const rzp = new window.Razorpay({
        key: RAZORPAY_KEY,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.orderId,
        name: 'TableFlow',
        description: plan === 'annual' ? 'Annual Plan — ₹9,999/year' : 'Monthly Plan — ₹999/month',
        prefill: { name: user.name, email: user.email },
        theme: { color: '#f59e0b' },
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch('/api/razorpay/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyData.verified) throw new Error('Payment verification failed');

            await SubscriptionService.activateSubscription({
              tenantId: user.tenantId,
              plan,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              amount: orderData.amount / 100,
            });

            await refreshSubscriptionStatus();
            router.push('/dashboard');
          } catch (err: any) {
            setError(err.message || 'Payment verification failed. Contact support.');
          } finally {
            setLoading(null);
          }
        },
        modal: { ondismiss: () => setLoading(null) },
      });
      rzp.open();
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
      setLoading(null);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
      style={{
        fontFamily: "'Inter', sans-serif",
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');`}</style>

      {/* ── Logo ── */}
      <div className="flex items-center gap-3 mb-10">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h18M3 6h18M3 14h12M3 18h8" />
          </svg>
        </div>
        <span className="text-2xl font-black text-white">
          Table<span style={{ color: '#f59e0b' }}>Flow</span>
        </span>
      </div>

      {/* ── Heading ── */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-black text-white mb-3">Choose Your Plan</h1>
        <p className="text-slate-400 text-base">
          Hi <span className="text-white font-semibold">{user?.name}</span> — upgrade to keep using TableFlow for{' '}
          <span style={{ color: '#f59e0b' }} className="font-bold">{user?.restaurantName}</span>
        </p>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="bg-red-900/40 border border-red-500/40 text-red-300 rounded-xl p-4 text-sm mb-6 max-w-md w-full">
          ⚠️ {error}
        </div>
      )}

      {/* ── Plans ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl w-full">

        {/* Monthly */}
        <div
          className="rounded-3xl p-8 border"
          style={{
            background: 'rgba(255,255,255,0.04)',
            borderColor: 'rgba(255,255,255,0.10)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div className="text-center mb-8">
            <h3 className="text-lg font-bold mb-4" style={{ color: '#94a3b8' }}>Monthly Plan</h3>
            <div className="flex items-end justify-center gap-1">
              <span className="text-2xl font-bold text-white">₹</span>
              <span className="text-6xl font-black text-white">999</span>
            </div>
            <p className="mt-2 text-sm" style={{ color: '#64748b' }}>per month, billed monthly</p>
          </div>

          <ul className="space-y-3 mb-8">
            {['Unlimited Orders & Tables', 'Admin + Waiter + Kitchen Roles', 'GST Billing & Invoices', 'Reports & Analytics', 'Inventory Management', 'WhatsApp Support'].map((f, i) => (
              <li key={i} className="flex items-center gap-3 text-sm" style={{ color: '#cbd5e1' }}>
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}
                >✓</span>
                {f}
              </li>
            ))}
          </ul>

          <button
            onClick={() => handleSubscribe('monthly')}
            disabled={!!loading}
            className="w-full font-bold py-4 rounded-2xl transition-all disabled:opacity-50"
            style={{
              background: 'rgba(245,158,11,0.12)',
              color: '#f59e0b',
              border: '1.5px solid rgba(245,158,11,0.35)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = '#f59e0b';
              (e.currentTarget as HTMLElement).style.color = '#0f172a';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(245,158,11,0.12)';
              (e.currentTarget as HTMLElement).style.color = '#f59e0b';
            }}
          >
            {loading === 'monthly' ? 'Processing...' : 'Subscribe Monthly — ₹999'}
          </button>
        </div>

        {/* Annual — highlighted */}
        <div
          className="relative rounded-3xl p-8 border-2"
          style={{
            background: 'linear-gradient(160deg, rgba(245,158,11,0.18) 0%, rgba(217,119,6,0.08) 100%)',
            borderColor: 'rgba(245,158,11,0.45)',
          }}
        >
          {/* Best Value badge */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
            <span
              className="text-xs font-black px-4 py-1.5 rounded-full shadow-lg"
              style={{ background: 'linear-gradient(90deg, #f59e0b, #d97706)', color: '#0f172a' }}
            >
              🔥 Best Value
            </span>
          </div>

          <div className="text-center mb-8">
            <h3 className="text-lg font-bold mb-4 text-white">Annual Plan</h3>
            <p className="text-lg line-through mb-1" style={{ color: '#64748b' }}>₹11,988</p>
            <div className="flex items-end justify-center gap-1">
              <span className="text-2xl font-bold text-white">₹</span>
              <span className="text-6xl font-black text-white">9,999</span>
            </div>
            <p className="mt-2 text-sm" style={{ color: '#f59e0b' }}>per year — save ₹2,989</p>
          </div>

          <ul className="space-y-3 mb-8">
            {['Everything in Monthly', '2 Months FREE', 'Priority Support', 'Advanced Analytics', 'Early Access to Features', 'Dedicated Account Manager'].map((f, i) => (
              <li key={i} className="flex items-center gap-3 text-sm text-white">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: 'rgba(245,158,11,0.25)', color: '#f59e0b' }}
                >✓</span>
                {f}
              </li>
            ))}
          </ul>

          <button
            onClick={() => handleSubscribe('annual')}
            disabled={!!loading}
            className="w-full font-black py-4 rounded-2xl transition-all disabled:opacity-50"
            style={{ background: '#f59e0b', color: '#0f172a' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#d97706'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#f59e0b'; }}
          >
            {loading === 'annual' ? 'Processing...' : 'Subscribe Annual — ₹9,999'}
          </button>
        </div>
      </div>

      {/* ── Footer note ── */}
      <p className="text-center mt-10 text-sm" style={{ color: '#475569' }}>
        🔒 Secure payment via Razorpay · UPI, Cards &amp; Net Banking accepted<br />
        Cancel anytime · Your data is always yours
      </p>
    </div>
  );
}
