'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Order } from '@/types';
import { getDocumentById, addDocument, updateDocument, createOrUpdateCustomerFromOrder } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Timestamp } from 'firebase/firestore';
import { toast } from 'sonner';

export default function GenerateBillPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card'>('cash');

  useEffect(() => {
    if (!orderId) {
      toast.error('Order ID is required');
      router.push('/dashboard/orders');
      return;
    }

    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      const orderData = await getDocumentById<Order>('orders', orderId!);
      if (orderData) {
        setOrder(orderData);
      } else {
        toast.error('Order not found');
        router.push('/dashboard/orders');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to load order');
      router.push('/dashboard/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBill = async () => {
    if (!order) return;

    setGenerating(true);
    try {
      // Generate bill number
      const billNumber = `BILL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Create bill data
      const billData: any = {
        billNumber,
        orderId: order.id,
        orderNumber: order.orderNumber,
        items: order.items,
        subtotal: order.subtotal,
        cgst: order.cgst,
        sgst: order.sgst,
        totalAmount: order.totalAmount,
        discount: order.discount || 0,
        paymentMethod,
        tableNumber: order.tableNumber || null,
        orderType: order.orderType,
        createdAt: Timestamp.now(),
        createdBy: user?.id || '',
        createdByName: user?.name || '',
      };

      // Add customer info if exists
      if (order.customerName) {
        billData.customerName = order.customerName;
      }
      if (order.customerPhone) {
        billData.customerPhone = order.customerPhone;
      }

      // Create bill in Firebase
      const billId = await addDocument('bills', billData);

      // Update order status and payment method
      await updateDocument('orders', order.id, {
        status: 'completed',
        paymentStatus: 'paid',
        paymentMethod,
        completedAt: Timestamp.now(),
      });

      // If dine-in, free up the table
      if (order.orderType === 'dine-in' && order.tableId) {
        await updateDocument('tables', order.tableId, {
          status: 'available',
          currentOrderId: null,
        });
      }

      // Automatically update or create customer record
      if (order.customerPhone && order.customerName) {
        try {
          await createOrUpdateCustomerFromOrder(
            order.customerPhone,
            order.customerName,
            order.totalAmount
          );
          toast.success('Bill generated and customer stats updated!');
        } catch (error) {
          console.error('Error updating customer:', error);
          toast.success('Bill generated successfully!');
        }
      } else {
        toast.success('Bill generated successfully!');
      }

      router.push(`/dashboard/billing/${billId}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate bill');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-600">Loading order...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Generate Bill</h1>
        <p className="mt-1 text-sm text-gray-600">Order #{order.orderNumber}</p>
      </div>

      {/* Bill Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Bill Preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Order Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Order Type</p>
              <p className="font-medium capitalize">{order.orderType}</p>
            </div>
            {order.tableNumber && (
              <div>
                <p className="text-gray-600">Table</p>
                <p className="font-medium">Table {order.tableNumber}</p>
              </div>
            )}
            <div>
              <p className="text-gray-600">Date</p>
              <p className="font-medium">{formatDate(order.createdAt, 'MMM dd, yyyy hh:mm a')}</p>
            </div>
            <div>
              <p className="text-gray-600">Waiter</p>
              <p className="font-medium">{order.waiterName}</p>
            </div>
          </div>

          {/* Customer Info */}
          {(order.customerName || order.customerPhone) && (
            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-2">Customer Details</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {order.customerName && (
                  <div>
                    <p className="text-gray-600">Name</p>
                    <p className="font-medium">{order.customerName}</p>
                  </div>
                )}
                {order.customerPhone && (
                  <div>
                    <p className="text-gray-600">Phone</p>
                    <p className="font-medium">{order.customerPhone}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Items */}
          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-3">Items</p>
            <div className="space-y-2">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <div className="flex-1">
                    <p className="font-medium">{item.itemName}</p>
                    <p className="text-gray-500">{item.quantity} × {formatCurrency(item.price)}</p>
                  </div>
                  <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">CGST</span>
              <span className="font-medium">{formatCurrency(order.cgst)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">SGST</span>
              <span className="font-medium">{formatCurrency(order.sgst)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Discount</span>
                <span className="font-medium text-red-600">-{formatCurrency(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total Amount</span>
              <span className="text-green-600">{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Select Payment Method *</Label>
            <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="card">Card</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => router.push(`/dashboard/orders/${order.id}`)} className="flex-1">
          Cancel
        </Button>
        <Button onClick={handleGenerateBill} disabled={generating} className="flex-1">
          {generating ? 'Generating...' : 'Generate Bill'}
        </Button>
      </div>
    </div>
  );
}
