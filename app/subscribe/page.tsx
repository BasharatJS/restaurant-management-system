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
      // 1. Create Razorpay order on backend
      const res = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, tenantId: user.tenantId }),
      });
      const orderData = await res.json();
      if (!res.ok) throw new Error(orderData.error || 'Failed to create order');

      // 2. Load Razorpay script
      await new Promise<void>((resolve, reject) => {
        if (window.Razorpay) { resolve(); return; }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Razorpay'));
        document.body.appendChild(script);
      });

      // 3. Open Razorpay checkout
      const rzp = new window.Razorpay({
        key: RAZORPAY_KEY,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.orderId,
        name: 'TableFlow',
        description: plan === 'annual' ? 'Annual Plan — ₹9,999/year' : 'Monthly Plan — ₹999/month',
        prefill: { name: user.name, email: user.email },
        theme: { color: '#6366f1' },
        handler: async (response: any) => {
          try {
            // 4. Verify signature on backend
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

            // 5. Activate subscription in Firestore
            await SubscriptionService.activateSubscription({
              tenantId: user.tenantId,
              plan,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              amount: orderData.amount / 100,
            });

            // 6. Refresh auth context and redirect
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col items-center justify-center px-6" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');`}</style>

      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-2.5 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h18M3 6h18M3 14h12M3 18h8" /></svg>
          </div>
          <span className="text-2xl font-black text-gray-900">Table<span className="text-indigo-600">Flow</span></span>
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-3">Choose Your Plan</h1>
        <p className="text-gray-500">Hi {user?.name} — upgrade to keep using TableFlow for <strong className="text-indigo-600">{user?.restaurantName}</strong></p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm mb-6 max-w-md w-full">⚠️ {error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl w-full">
        {/* Monthly */}
        <div className="bg-white rounded-3xl p-8 border-2 border-gray-200 shadow-lg">
          <div className="text-center mb-8">
            <h3 className="text-xl font-bold text-gray-500 mb-4">Monthly Plan</h3>
            <div className="flex items-end justify-center gap-1">
              <span className="text-2xl font-bold text-gray-500">₹</span>
              <span className="text-6xl font-black text-gray-900">999</span>
            </div>
            <p className="mt-2 text-sm text-gray-500">per month, billed monthly</p>
          </div>
          <ul className="space-y-3 mb-8">
            {['Unlimited Orders & Tables', 'Admin + Waiter + Kitchen Roles', 'GST Billing & Invoices', 'Reports & Analytics', 'Inventory Management', 'WhatsApp Support'].map((f, i) => (
              <li key={i} className="flex items-center gap-3 text-sm text-gray-600">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">✓</span>{f}
              </li>
            ))}
          </ul>
          <button onClick={() => handleSubscribe('monthly')} disabled={!!loading} className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-md">
            {loading === 'monthly' ? 'Processing...' : 'Subscribe Monthly — ₹999'}
          </button>
        </div>

        {/* Annual */}
        <div className="relative bg-gradient-to-b from-indigo-600 to-purple-700 rounded-3xl p-8 border-2 border-indigo-400 shadow-2xl text-white">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
            <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">🔥 Best Value</span>
          </div>
          <div className="text-center mb-8">
            <h3 className="text-xl font-bold text-indigo-100 mb-4">Annual Plan</h3>
            <p className="text-lg line-through text-indigo-200 mb-1">₹11,988</p>
            <div className="flex items-end justify-center gap-1">
              <span className="text-2xl font-bold text-indigo-100">₹</span>
              <span className="text-6xl font-black">9,999</span>
            </div>
            <p className="mt-2 text-sm text-indigo-100">per year — save ₹2,989</p>
          </div>
          <ul className="space-y-3 mb-8">
            {['Everything in Monthly', '2 Months FREE', 'Priority Support', 'Advanced Analytics', 'Early Access to Features', 'Dedicated Account Manager'].map((f, i) => (
              <li key={i} className="flex items-center gap-3 text-sm text-indigo-50">
                <span className="w-5 h-5 rounded-full bg-white/20 text-white flex items-center justify-center text-xs font-bold">✓</span>{f}
              </li>
            ))}
          </ul>
          <button onClick={() => handleSubscribe('annual')} disabled={!!loading} className="w-full bg-white text-indigo-700 font-bold py-4 rounded-2xl hover:bg-indigo-50 transition-all disabled:opacity-50 shadow-lg">
            {loading === 'annual' ? 'Processing...' : 'Subscribe Annual — ₹9,999'}
          </button>
        </div>
      </div>

      <p className="text-gray-400 text-sm mt-8 text-center">
        Secure payment via Razorpay • All major UPI, Cards, Net Banking accepted<br />
        Cancel anytime • Your data is always yours
      </p>
    </div>
  );
}
