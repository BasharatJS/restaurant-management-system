'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Bill } from '@/types';
import { getDocumentById } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

export default function BillDetailsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const billId = params.billId as string;
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBill();
  }, [billId]);

  const loadBill = async () => {
    try {
      const billData = await getDocumentById<Bill>('bills', billId);
      if (billData) {
        setBill(billData);
      } else {
        toast.error('Bill not found');
        router.push('/dashboard/billing');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to load bill');
      router.push('/dashboard/billing');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-600">Loading bill...</p>
        </div>
      </div>
    );
  }

  if (!bill) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bill Invoice</h1>
          <p className="mt-1 text-sm text-gray-600">Bill #{bill.billNumber}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/dashboard/billing')}>
            Back to Billing
          </Button>
          <Button onClick={() => window.print()}>
            Print Bill
          </Button>
        </div>
      </div>

      {/* Bill Content */}
      <Card>
        <CardContent className="p-8">
          {/* Restaurant Header */}
          <div className="text-center border-b pb-4 mb-6">
            <h2 className="text-2xl font-bold">My Restaurant</h2>
            <p className="text-sm text-gray-600">123 Main Street, City</p>
            <p className="text-sm text-gray-600">Phone: 9876543210</p>
            <p className="text-sm text-gray-600">GSTIN: 29ABCDE1234F1Z5</p>
          </div>

          {/* Bill Details */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-sm text-gray-600">Bill Number</p>
              <p className="font-semibold">{bill.billNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Order Number</p>
              <p className="font-semibold">{bill.orderNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Date & Time</p>
              <p className="font-semibold">{formatDate(bill.createdAt, 'MMM dd, yyyy hh:mm a')}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Payment Method</p>
              <p className="font-semibold capitalize">{bill.paymentMethod}</p>
            </div>
            {bill.tableNumber && (
              <div>
                <p className="text-sm text-gray-600">Table Number</p>
                <p className="font-semibold">Table {bill.tableNumber}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Order Type</p>
              <p className="font-semibold capitalize">{bill.orderType}</p>
            </div>
          </div>

          {/* Customer Info */}
          {(bill.customerName || bill.customerPhone) && (
            <div className="mb-6 border-t pt-4">
              <p className="text-sm font-medium mb-2">Customer Details</p>
              <div className="grid grid-cols-2 gap-4">
                {bill.customerName && (
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-semibold">{bill.customerName}</p>
                  </div>
                )}
                {bill.customerPhone && (
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-semibold">{bill.customerPhone}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Items Table */}
          <div className="mb-6">
            <table className="w-full">
              <thead className="border-b-2">
                <tr>
                  <th className="text-left py-2">#</th>
                  <th className="text-left py-2">Item</th>
                  <th className="text-right py-2">Qty</th>
                  <th className="text-right py-2">Price</th>
                  <th className="text-right py-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {bill.items.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-3">{index + 1}</td>
                    <td className="py-3">
                      <p className="font-medium">{item.itemName}</p>
                      {item.specialInstructions && (
                        <p className="text-xs text-gray-500">Note: {item.specialInstructions}</p>
                      )}
                    </td>
                    <td className="text-right py-3">{item.quantity}</td>
                    <td className="text-right py-3">{formatCurrency(item.price)}</td>
                    <td className="text-right py-3 font-medium">
                      {formatCurrency(item.price * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="ml-auto w-80 space-y-2">
            <div className="flex justify-between py-1">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">{formatCurrency(bill.subtotal)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-600">CGST</span>
              <span className="font-medium">{formatCurrency(bill.cgst)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-600">SGST</span>
              <span className="font-medium">{formatCurrency(bill.sgst)}</span>
            </div>
            {bill.discount > 0 && (
              <div className="flex justify-between py-1">
                <span className="text-gray-600">Discount</span>
                <span className="font-medium text-red-600">-{formatCurrency(bill.discount)}</span>
              </div>
            )}
            <div className="flex justify-between py-2 border-t-2 text-lg font-bold">
              <span>Total Amount</span>
              <span className="text-green-600">{formatCurrency(bill.totalAmount)}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-4 border-t text-center">
            <p className="text-sm text-gray-600">Thank you for dining with us!</p>
            <p className="text-xs text-gray-500 mt-1">This is a computer-generated bill</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
