'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Bill } from '@/types';
import { subscribeToCollection } from '@/lib/firestore';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatDate } from '@/lib/utils';
import { orderBy } from 'firebase/firestore';

export default function BillingPage() {
  const { user } = useAuth();
  const tenantId = user?.tenantId || '';
  const router = useRouter();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user && !['admin', 'waiter'].includes(user.role)) {
      router.push('/dashboard');
      return;
    }

    const unsubscribe = subscribeToCollection<Bill>(
      tenantId,
      'bills',
      (data) => {
        setBills(data);
        setLoading(false);
      },
      [orderBy('createdAt', 'desc')]
    );

    return () => unsubscribe();
  }, [tenantId]);

  const filteredBills = bills.filter(
    (bill) =>
      bill.billNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.customerName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-amber-500 border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-600">Loading bills...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Billing &amp; Invoices</h1>
        <p className="mt-1 text-sm text-gray-500">View and print past bills. To generate a new bill, complete an order first.</p>
      </div>

      {/* ── How to generate a bill — flow guide ── */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5">
        <div className="flex items-start gap-3 mb-4">
          <span className="text-2xl">📋</span>
          <div>
            <h2 className="font-bold text-gray-900 text-sm">How to Generate a Bill</h2>
            <p className="text-xs text-gray-500 mt-0.5">Follow these steps to create and print a bill for a customer</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
          {[
            { step: '1', icon: '🪑', title: 'Take an Order', desc: 'Go to Tables, select a table and create a new order with items.' },
            { step: '2', icon: '🍳', title: 'Kitchen Prepares', desc: 'Kitchen staff marks the order as Ready when food is prepared.' },
            { step: '3', icon: '✅', title: 'Mark as Served + Paid', desc: 'Waiter sets order status to Served and payment to Paid.' },
            { step: '4', icon: '🧾', title: 'Generate Bill', desc: 'Open the order → click "Generate Bill" to create the invoice.' },
          ].map((s) => (
            <div key={s.step} className="bg-white rounded-xl p-3 border border-amber-100">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{s.step}</span>
                <span className="text-base">{s.icon}</span>
              </div>
              <p className="text-xs font-bold text-gray-900">{s.title}</p>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
        <button
          onClick={() => router.push('/dashboard/orders')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          View Active Orders
        </button>
      </div>

      {/* ── Past Bills ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            Bill History
            <span className="ml-2 text-sm font-normal text-gray-400">({bills.length} total)</span>
          </h2>
          <Input
            placeholder="Search by bill # or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xs"
          />
        </div>

        {filteredBills.length > 0 ? (
          <div className="space-y-3">
            {filteredBills.map((bill) => (
              <div
                key={bill.id}
                className="bg-white border border-gray-200 rounded-2xl p-5 cursor-pointer hover:shadow-md hover:border-amber-300 transition-all group"
                onClick={() => router.push(`/dashboard/billing/${bill.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-base font-bold text-gray-900">{bill.billNumber}</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                        ✓ Paid
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      {bill.customerName && (
                        <div>
                          <p className="text-xs text-gray-400">Customer</p>
                          <p className="font-medium text-gray-800">{bill.customerName}</p>
                        </div>
                      )}
                      {bill.tableNumber && (
                        <div>
                          <p className="text-xs text-gray-400">Table</p>
                          <p className="font-medium text-gray-800">Table {bill.tableNumber}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-400">Payment</p>
                        <p className="font-medium text-gray-800 capitalize">{bill.paymentMethod}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Date &amp; Time</p>
                        <p className="font-medium text-gray-800">{formatDate(bill.createdAt, 'MMM dd, hh:mm a')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="text-right ml-4 flex flex-col items-end gap-1">
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(bill.totalAmount)}</p>
                    <p className="text-xs text-gray-400">{bill.items.length} items</p>
                    <span className="text-xs text-amber-600 font-medium group-hover:underline">View Invoice →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-gray-900">No bills yet</h3>
            <p className="mt-1 text-sm text-gray-400 max-w-xs mx-auto">
              Bills appear here after you complete an order and generate an invoice.
            </p>
            <button
              onClick={() => router.push('/dashboard/orders')}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold rounded-lg transition-colors"
            >
              Go to Orders
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
