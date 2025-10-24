'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Order } from '@/types';
import { subscribeToCollection, updateDocument } from '@/lib/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate, getTimeAgo } from '@/lib/utils';
import { orderBy, where } from 'firebase/firestore';
import { toast } from 'sonner';

export default function KitchenDisplayPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && !['admin', 'kitchen'].includes(user.role)) {
      router.push('/dashboard');
      return;
    }

    // Subscribe to active orders only
    const unsubscribe = subscribeToCollection<Order>(
      'orders',
      (data) => {
        // Filter only pending, preparing, and ready orders
        const activeOrders = data.filter(
          (order) => ['pending', 'preparing', 'ready'].includes(order.status)
        );
        setOrders(activeOrders);
        setLoading(false);
      },
      [orderBy('createdAt', 'asc')]
    );

    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      // Trigger re-render
      setOrders((prev) => [...prev]);
    }, 10000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [user, router]);

  const handleStatusUpdate = async (orderId: string, newStatus: 'preparing' | 'ready') => {
    try {
      await updateDocument('orders', orderId, { status: newStatus });
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update order status');
    }
  };

  const getOrderColor = (order: Order) => {
    const createdAt = order.createdAt.toDate();
    const now = new Date();
    const diffInMinutes = (now.getTime() - createdAt.getTime()) / 60000;

    // Color coding by time
    if (diffInMinutes < 5) return 'bg-green-50 border-green-200';
    if (diffInMinutes < 15) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getPriorityBadge = (order: Order) => {
    const createdAt = order.createdAt.toDate();
    const now = new Date();
    const diffInMinutes = (now.getTime() - createdAt.getTime()) / 60000;

    if (diffInMinutes < 5)
      return <Badge className="bg-green-600">New</Badge>;
    if (diffInMinutes < 15)
      return <Badge className="bg-yellow-600">In Progress</Badge>;
    return <Badge className="bg-red-600">Delayed</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-600">Loading kitchen display...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kitchen Display System</h1>
          <p className="mt-1 text-sm text-gray-600">
            Active orders: {orders.length} | Auto-refresh every 10 seconds
          </p>
        </div>
        <div className="flex gap-2">
          <div className="px-3 py-1 rounded-lg bg-green-100 text-green-800 text-sm font-medium">
            Pending: {orders.filter((o) => o.status === 'pending').length}
          </div>
          <div className="px-3 py-1 rounded-lg bg-blue-100 text-blue-800 text-sm font-medium">
            Preparing: {orders.filter((o) => o.status === 'preparing').length}
          </div>
          <div className="px-3 py-1 rounded-lg bg-purple-100 text-purple-800 text-sm font-medium">
            Ready: {orders.filter((o) => o.status === 'ready').length}
          </div>
        </div>
      </div>

      {orders.length === 0 ? (
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
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No active orders</h3>
          <p className="mt-1 text-sm text-gray-500">All orders are completed or served.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orders.map((order) => (
            <Card key={order.id} className={`${getOrderColor(order)} border-2`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold">{order.orderNumber}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {order.tableNumber ? `Table ${order.tableNumber}` : order.orderType}
                    </p>
                  </div>
                  {getPriorityBadge(order)}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                  <span>{getTimeAgo(order.createdAt)}</span>
                  <span>•</span>
                  <span>{formatDate(order.createdAt, 'hh:mm a')}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Order Items */}
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-700">Items:</p>
                  {order.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between bg-white p-2 rounded border"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.itemName}</p>
                        {item.specialInstructions && (
                          <p className="text-xs text-red-600 mt-1">
                            Note: {item.specialInstructions}
                          </p>
                        )}
                      </div>
                      <div className="text-lg font-bold text-blue-600 ml-2">x{item.quantity}</div>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-2 border-t">
                  {order.status === 'pending' && (
                    <Button
                      onClick={() => handleStatusUpdate(order.id, 'preparing')}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      Start Preparing
                    </Button>
                  )}
                  {order.status === 'preparing' && (
                    <Button
                      onClick={() => handleStatusUpdate(order.id, 'ready')}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      Mark as Ready
                    </Button>
                  )}
                  {order.status === 'ready' && (
                    <div className="text-center py-2 bg-green-100 rounded-lg">
                      <p className="text-sm font-semibold text-green-800">Ready for Serving</p>
                    </div>
                  )}
                </div>

                {/* Waiter Info */}
                <div className="text-xs text-gray-500 pt-2 border-t">
                  Waiter: {order.waiterName}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
