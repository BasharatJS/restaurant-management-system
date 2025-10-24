'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Bill } from '@/types';
import { subscribeToCollection } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { orderBy } from 'firebase/firestore';

export default function BillingPage() {
  const { user } = useAuth();
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
      'bills',
      (data) => {
        setBills(data);
        setLoading(false);
      },
      [orderBy('createdAt', 'desc')]
    );

    return () => unsubscribe();
  }, [user, router]);

  const filteredBills = bills.filter(
    (bill) =>
      bill.billNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.customerName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-600">Loading bills...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing & Invoices</h1>
          <p className="mt-1 text-sm text-gray-600">View and manage all bills and invoices</p>
        </div>
        <Button onClick={() => router.push('/dashboard/orders')}>
          <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Generate Bill
        </Button>
      </div>

      {/* Search */}
      <Input
        placeholder="Search by bill number or customer name..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="max-w-md"
      />

      {/* Bills List */}
      {filteredBills.length > 0 ? (
        <div className="space-y-4">
          {filteredBills.map((bill) => (
            <Card
              key={bill.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => router.push(`/dashboard/billing/${bill.id}`)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{bill.billNumber}</h3>
                      <Badge className="bg-green-100 text-green-800">Paid</Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      {bill.customerName && (
                        <div>
                          <p className="text-xs text-gray-500">Customer</p>
                          <p className="font-medium">{bill.customerName}</p>
                        </div>
                      )}

                      {bill.tableNumber && (
                        <div>
                          <p className="text-xs text-gray-500">Table</p>
                          <p className="font-medium">Table {bill.tableNumber}</p>
                        </div>
                      )}

                      <div>
                        <p className="text-xs text-gray-500">Payment Method</p>
                        <p className="font-medium capitalize">{bill.paymentMethod}</p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500">Date</p>
                        <p className="font-medium">{formatDate(bill.createdAt, 'MMM dd, hh:mm a')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="text-right ml-4">
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(bill.totalAmount)}</p>
                    <p className="text-xs text-gray-500 mt-1">{bill.items.length} items</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No bills found</h3>
          <p className="mt-1 text-sm text-gray-500">Create orders and generate bills to see them here.</p>
        </div>
      )}
    </div>
  );
}
