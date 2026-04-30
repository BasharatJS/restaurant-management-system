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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');`}</style>

      {success && (
        <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Welcome to TableFlow!</h2>
            <p className="text-gray-500 mb-2">Your 7-day free trial has started.</p>
            <p className="text-indigo-600 font-semibold">Setting up your dashboard...</p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mt-4" />
          </div>
        </div>
      )}

      <nav className="w-full px-6 py-5 flex items-center justify-between max-w-6xl mx-auto">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h18M3 6h18M3 14h12M3 18h8" /></svg>
          </div>
          <span className="text-xl font-black text-gray-900">Table<span className="text-indigo-600">Flow</span></span>
        </Link>
        <Link href="/login" className="text-sm font-semibold text-gray-600 hover:text-indigo-600 transition-colors">Already registered? Sign In →</Link>
      </nav>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="h-1.5 bg-gray-100">
              <div className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-500" style={{ width: step === 1 ? '50%' : '100%' }} />
            </div>
            <div className="p-8 md:p-10">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
                  <span className="text-3xl">{step === 1 ? '🍽️' : '🔐'}</span>
                </div>
                <div className="flex items-center justify-center gap-2 mb-3">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}>1. Restaurant</span>
                  <span className="text-gray-300">→</span>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}>2. Account</span>
                </div>
                <h1 className="text-2xl font-black text-gray-900">{step === 1 ? 'Tell us about your restaurant' : 'Create your account'}</h1>
                <p className="text-gray-500 mt-2 text-sm">
                  {step === 1 ? "We'll set up a dedicated dashboard for your restaurant" : '7-day free trial starts immediately — no credit card needed'}
                </p>
              </div>

              {step === 1 && (
                <form onSubmit={handleStep1} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">🏪 Restaurant Name</label>
                    <input type="text" value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} placeholder="e.g. Spice Garden Restaurant" className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors text-gray-900 placeholder-gray-400" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">👤 Your Name (Owner / Manager)</label>
                    <input type="text" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="e.g. Mohammed Basharat" className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors text-gray-900 placeholder-gray-400" />
                  </div>
                  {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">⚠️ {error}</div>}
                  <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all hover:scale-105 shadow-lg shadow-indigo-200 text-lg">Continue →</button>
                </form>
              )}

              {step === 2 && (
                <form onSubmit={handleSignup} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">📧 Email Address</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@restaurant.com" disabled={loading} className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors text-gray-900 placeholder-gray-400 disabled:opacity-50" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">🔒 Password</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 6 characters" disabled={loading} className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors text-gray-900 placeholder-gray-400 disabled:opacity-50" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">🔒 Confirm Password</label>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter your password" disabled={loading} className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors text-gray-900 placeholder-gray-400 disabled:opacity-50" />
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                    <span className="text-2xl">🎁</span>
                    <div>
                      <p className="text-green-800 font-bold text-sm">7-Day Free Trial Included!</p>
                      <p className="text-green-600 text-xs mt-0.5">Full access, no credit card, cancel anytime.</p>
                    </div>
                  </div>
                  {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">⚠️ {error}</div>}
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setStep(1)} disabled={loading} className="px-6 py-4 border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:border-indigo-300 transition-colors">← Back</button>
                    <button type="submit" disabled={loading} className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all hover:scale-105 disabled:opacity-50 disabled:scale-100 shadow-lg shadow-indigo-200">
                      {loading ? <span className="flex items-center justify-center gap-2"><span className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />Creating your restaurant...</span> : '🚀 Create Account & Start Trial'}
                    </button>
                  </div>
                </form>
              )}

              <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                <p className="text-gray-400 text-xs">By creating an account you agree to our Terms of Service and Privacy Policy.</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-8 mt-8 text-gray-400 text-xs">
            <span>🔒 Secure & Encrypted</span><span>🛡️ Data Isolated</span><span>✅ No Hidden Fees</span>
          </div>
        </div>
      </div>
    </div>
  );
}
