'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Order } from '@/types';
import { subscribeToCollection, updateDocument } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import { orderBy } from 'firebase/firestore';

export default function OrdersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (user && !['admin', 'waiter'].includes(user.role)) {
      router.push('/dashboard');
      return;
    }

    const unsubscribe = subscribeToCollection<Order>(
      'orders',
      (data) => {
        setOrders(data);
        setLoading(false);
      },
      [orderBy('createdAt', 'desc')]
    );

    return () => unsubscribe();
  }, [user, router]);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.tableNumber?.toString().includes(searchQuery);

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    preparing: orders.filter((o) => o.status === 'preparing').length,
    ready: orders.filter((o) => o.status === 'ready').length,
    served: orders.filter((o) => o.status === 'served').length,
    completed: orders.filter((o) => o.status === 'completed').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <p className="mt-1 text-sm text-gray-600">View and manage all orders</p>
        </div>
        <Button onClick={() => router.push('/dashboard/orders/new')}>
          <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Order
        </Button>
      </div>

      {/* Search */}
      <Input
        placeholder="Search by order number, customer name, or table..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="max-w-md"
      />

      {/* Status Tabs */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          <TabsTrigger value="all">All ({statusCounts.all})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({statusCounts.pending})</TabsTrigger>
          <TabsTrigger value="preparing">Preparing ({statusCounts.preparing})</TabsTrigger>
          <TabsTrigger value="ready">Ready ({statusCounts.ready})</TabsTrigger>
          <TabsTrigger value="served">Served ({statusCounts.served})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({statusCounts.completed})</TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="mt-6">
          {filteredOrders.length > 0 ? (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <Card
                  key={order.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{order.orderNumber}</h3>
                          <Badge className={getStatusColor(order.status)} variant="outline">
                            {order.status}
                          </Badge>
                          <Badge className={getStatusColor(order.paymentStatus)} variant="outline">
                            {order.paymentStatus}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <p className="text-xs text-gray-500">Type</p>
                            <p className="font-medium capitalize">{order.orderType}</p>
                          </div>

                          {order.tableNumber && (
                            <div>
                              <p className="text-xs text-gray-500">Table</p>
                              <p className="font-medium">Table {order.tableNumber}</p>
                            </div>
                          )}

                          <div>
                            <p className="text-xs text-gray-500">Items</p>
                            <p className="font-medium">{order.items.length} items</p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-500">Waiter</p>
                            <p className="font-medium">{order.waiterName}</p>
                          </div>

                          {order.customerName && (
                            <div>
                              <p className="text-xs text-gray-500">Customer</p>
                              <p className="font-medium">{order.customerName}</p>
                            </div>
                          )}

                          <div>
                            <p className="text-xs text-gray-500">Created</p>
                            <p className="font-medium">{formatDate(order.createdAt, 'MMM dd, hh:mm a')}</p>
                          </div>
                        </div>
                      </div>

                      <div className="text-right ml-4">
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(order.totalAmount)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filters.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
