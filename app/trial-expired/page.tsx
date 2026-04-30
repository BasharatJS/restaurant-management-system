'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function TrialExpiredPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 flex flex-col items-center justify-center px-6" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');`}</style>
      <div className="text-center max-w-lg">
        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-5xl">⏰</span>
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-3">Your Free Trial Has Ended</h1>
        <p className="text-gray-500 text-lg mb-2">
          Hi <strong className="text-gray-700">{user?.name}</strong> from <strong className="text-indigo-600">{user?.restaurantName}</strong>
        </p>
        <p className="text-gray-500 mb-8">
          Your 7-day free trial has expired. Upgrade to continue using TableFlow and keep all your data.
        </p>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 text-left shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">What you'll get with a subscription:</h3>
          <ul className="space-y-3">
            {[
              'All your existing data is safe and preserved',
              'Unlimited orders, tables, and staff',
              'GST billing and professional invoices',
              'Real-time kitchen display system',
              'Reports and analytics',
              'Priority support',
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-sm text-gray-600">
                <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold flex-shrink-0">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl border-2 border-gray-200 p-4 text-center">
            <p className="text-2xl font-black text-gray-900">₹999</p>
            <p className="text-sm text-gray-500">per month</p>
          </div>
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl border-2 border-indigo-400 p-4 text-center">
            <p className="text-2xl font-black text-white">₹9,999</p>
            <p className="text-sm text-indigo-100">per year (save ₹2,989)</p>
          </div>
        </div>

        <Link href="/subscribe" className="block w-full bg-gradient-to-r from-indigo-600 to-purple-700 text-white font-black text-lg py-4 rounded-2xl shadow-xl hover:scale-105 transition-all mb-4">
          🚀 Upgrade Now
        </Link>
        <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          Sign out →
        </button>
      </div>
    </div>
  );
}
