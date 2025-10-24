'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { StatsCard } from '@/components/dashboard/stats-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { subscribeToCollection } from '@/lib/firestore';
import { Order, Table } from '@/types';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import { where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);

  // Calculate statistics
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayOrders = orders.filter((order) => {
    const orderDate = order.createdAt instanceof Timestamp ? order.createdAt.toDate() : new Date(order.createdAt);
    return orderDate >= today;
  });

  const todayRevenue = todayOrders
    .filter((order) => order.paymentStatus === 'paid')
    .reduce((sum, order) => sum + order.totalAmount, 0);

  const activeTables = tables.filter((table) => table.status === 'occupied').length;

  const recentOrders = orders.slice(0, 5);

  // Calculate popular items
  const itemCounts: Record<string, number> = {};
  todayOrders.forEach((order) => {
    order.items.forEach((item) => {
      itemCounts[item.itemName] = (itemCounts[item.itemName] || 0) + item.quantity;
    });
  });

  const popularItems = Object.entries(itemCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  // Calculate revenue chart data (last 7 days)
  const revenueChartData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    date.setHours(0, 0, 0, 0);

    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    const dayOrders = orders.filter((order) => {
      const orderDate = order.createdAt instanceof Timestamp ? order.createdAt.toDate() : new Date(order.createdAt);
      return orderDate >= date && orderDate < nextDay && order.paymentStatus === 'paid';
    });

    const revenue = dayOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue,
    };
  });

  useEffect(() => {
    setLoading(true);

    // Subscribe to orders
    const unsubscribeOrders = subscribeToCollection<Order>(
      'orders',
      (data) => {
        setOrders(data);
        setLoading(false);
      },
      [orderBy('createdAt', 'desc'), limit(50)]
    );

    // Subscribe to tables
    const unsubscribeTables = subscribeToCollection<Table>('tables', (data) => {
      setTables(data);
    });

    return () => {
      unsubscribeOrders();
      unsubscribeTables();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Waiter-specific data
  const myTodayOrders = user?.role === 'waiter'
    ? todayOrders.filter(order => order.waiterId === user?.id)
    : todayOrders;

  const pendingOrders = orders.filter(order =>
    order.status !== 'completed' && order.status !== 'cancelled'
  );

  const myPendingOrders = user?.role === 'waiter'
    ? pendingOrders.filter(order => order.waiterId === user?.id)
    : pendingOrders;

  const availableTables = tables.filter(table => table.status === 'available');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {user?.role === 'waiter' ? 'Waiter Dashboard' :
             user?.role === 'kitchen' ? 'Kitchen Dashboard' : 'Dashboard'}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Welcome back, {user?.name}!
            {user?.role === 'waiter' && ` You have ${myPendingOrders.length} active orders today.`}
            {user?.role === 'admin' && ` Here's what's happening today.`}
            {user?.role === 'kitchen' && ` ${pendingOrders.length} orders in queue.`}
          </p>
        </div>
        {user?.role !== 'kitchen' && (
          <Button onClick={() => router.push('/dashboard/orders/new')} size="lg">
            <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Order
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {user?.role === 'kitchen' ? (
          <>
            <StatsCard
              title="Pending Orders"
              value={pendingOrders.filter(o => o.status === 'pending').length}
              icon={
                <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />

            <StatsCard
              title="Preparing"
              value={pendingOrders.filter(o => o.status === 'preparing').length}
              icon={
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              }
            />

            <StatsCard
              title="Ready to Serve"
              value={pendingOrders.filter(o => o.status === 'ready').length}
              icon={
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />

            <StatsCard
              title="Completed Today"
              value={orders.filter(o => (o.status === 'completed' || o.status === 'served') && o.createdAt.toDate() >= today).length}
              icon={
                <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
            />
          </>
        ) : user?.role === 'waiter' ? (
          <>
            <StatsCard
              title="My Today's Orders"
              value={myTodayOrders.length}
              icon={
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
            />

            <StatsCard
              title="Active Orders"
              value={myPendingOrders.length}
              icon={
                <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />

            <StatsCard
              title="Available Tables"
              value={availableTables.length}
              icon={
                <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              }
            />

            <StatsCard
              title="My Total Sales"
              value={formatCurrency(
                myTodayOrders
                  .filter(o => o.paymentStatus === 'paid')
                  .reduce((sum, o) => sum + o.totalAmount, 0)
              )}
              icon={
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
          </>
        ) : (
          <>
            <StatsCard
              title="Today's Revenue"
              value={formatCurrency(todayRevenue)}
              icon={
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />

            <StatsCard
              title="Today's Orders"
              value={todayOrders.length}
              icon={
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
            />

            <StatsCard
              title="Active Tables"
              value={`${activeTables} / ${tables.length}`}
              icon={
                <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              }
            />

            <StatsCard
              title="Avg Order Value"
              value={formatCurrency(todayOrders.length > 0 ? todayRevenue / todayOrders.length : 0)}
              icon={
                <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              }
            />
          </>
        )}
      </div>

      {user?.role !== 'waiter' && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Revenue Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Revenue Trend (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Popular Items */}
          <Card>
            <CardHeader>
              <CardTitle>Popular Items Today</CardTitle>
            </CardHeader>
            <CardContent>
              {popularItems.length > 0 ? (
                <div className="space-y-4">
                  {popularItems.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                          {index + 1}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{item.name}</span>
                      </div>
                      <Badge variant="outline">{item.count} sold</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-sm text-gray-500 py-8">No orders yet today</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Waiter: Active Orders & Available Tables */}
      {user?.role === 'waiter' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* My Active Orders */}
          <Card>
            <CardHeader>
              <CardTitle>My Active Orders ({myPendingOrders.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {myPendingOrders.length > 0 ? (
                <div className="space-y-3">
                  {myPendingOrders.slice(0, 6).map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between border-b pb-3 last:border-0 cursor-pointer hover:bg-gray-50 p-2 rounded"
                      onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{order.orderNumber}</p>
                          <Badge className={getStatusColor(order.status)} variant="outline">
                            {order.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {order.tableNumber ? `Table ${order.tableNumber}` : order.orderType}
                        </p>
                      </div>
                      <p className="font-semibold">{formatCurrency(order.totalAmount)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-sm text-gray-500 py-8">No active orders</p>
              )}
            </CardContent>
          </Card>

          {/* Available Tables */}
          <Card>
            <CardHeader>
              <CardTitle>Available Tables ({availableTables.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {availableTables.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {availableTables.slice(0, 9).map((table) => (
                    <div
                      key={table.id}
                      className="border-2 border-green-300 bg-green-50 rounded-lg p-4 text-center cursor-pointer hover:bg-green-100 transition"
                      onClick={() => router.push(`/dashboard/orders/new?tableId=${table.id}`)}
                    >
                      <p className="text-2xl font-bold text-green-700">{table.tableNumber}</p>
                      <p className="text-xs text-green-600 mt-1">{table.capacity} seats</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-sm text-gray-500 py-8">All tables occupied</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Kitchen: Order Queue by Status */}
      {user?.role === 'kitchen' && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Pending Orders */}
          <Card className="border-yellow-300 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                Pending Orders ({pendingOrders.filter(o => o.status === 'pending').length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingOrders.filter(o => o.status === 'pending').length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {pendingOrders.filter(o => o.status === 'pending').slice(0, 5).map((order) => (
                    <div
                      key={order.id}
                      className="bg-white border border-yellow-200 rounded-lg p-3 cursor-pointer hover:shadow-md transition"
                      onClick={() => router.push(`/dashboard/orders/kitchen`)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-bold text-yellow-800">{order.orderNumber}</p>
                        <Badge variant="outline" className="bg-yellow-100">
                          {order.tableNumber ? `Table ${order.tableNumber}` : order.orderType}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{order.items.length} items</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(order.createdAt, 'hh:mm a')}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-sm text-gray-500 py-8">No pending orders</p>
              )}
            </CardContent>
          </Card>

          {/* Preparing Orders */}
          <Card className="border-blue-300 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                Preparing ({pendingOrders.filter(o => o.status === 'preparing').length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingOrders.filter(o => o.status === 'preparing').length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {pendingOrders.filter(o => o.status === 'preparing').slice(0, 5).map((order) => (
                    <div
                      key={order.id}
                      className="bg-white border border-blue-200 rounded-lg p-3 cursor-pointer hover:shadow-md transition"
                      onClick={() => router.push(`/dashboard/orders/kitchen`)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-bold text-blue-800">{order.orderNumber}</p>
                        <Badge variant="outline" className="bg-blue-100">
                          {order.tableNumber ? `Table ${order.tableNumber}` : order.orderType}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{order.items.length} items</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(order.createdAt, 'hh:mm a')}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-sm text-gray-500 py-8">No orders preparing</p>
              )}
            </CardContent>
          </Card>

          {/* Ready Orders */}
          <Card className="border-green-300 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                Ready ({pendingOrders.filter(o => o.status === 'ready').length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingOrders.filter(o => o.status === 'ready').length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {pendingOrders.filter(o => o.status === 'ready').slice(0, 5).map((order) => (
                    <div
                      key={order.id}
                      className="bg-white border border-green-200 rounded-lg p-3 cursor-pointer hover:shadow-md transition"
                      onClick={() => router.push(`/dashboard/orders/kitchen`)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-bold text-green-800">{order.orderNumber}</p>
                        <Badge variant="outline" className="bg-green-100">
                          {order.tableNumber ? `Table ${order.tableNumber}` : order.orderType}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{order.items.length} items</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(order.createdAt, 'hh:mm a')}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-sm text-gray-500 py-8">No ready orders</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Kitchen: Quick Stats */}
      {user?.role === 'kitchen' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Today's Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-gray-600">Total Orders Completed</span>
                <span className="text-2xl font-bold text-green-600">
                  {orders.filter(o => o.status === 'completed' || o.status === 'served').length}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-gray-600">Orders in Queue</span>
                <span className="text-2xl font-bold text-orange-600">{pendingOrders.length}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-600">Total Items Prepared</span>
                <span className="text-2xl font-bold text-blue-600">
                  {orders
                    .filter(o => o.status === 'completed' || o.status === 'served')
                    .reduce((sum, o) => sum + o.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full"
                size="lg"
                onClick={() => router.push('/dashboard/orders/kitchen')}
              >
                <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Go to Kitchen Display
              </Button>
              <div className="grid grid-cols-3 gap-2 pt-2">
                <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-2xl font-bold text-yellow-700">
                    {pendingOrders.filter(o => o.status === 'pending').length}
                  </p>
                  <p className="text-xs text-yellow-600 mt-1">Pending</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-2xl font-bold text-blue-700">
                    {pendingOrders.filter(o => o.status === 'preparing').length}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">Cooking</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-2xl font-bold text-green-700">
                    {pendingOrders.filter(o => o.status === 'ready').length}
                  </p>
                  <p className="text-xs text-green-600 mt-1">Ready</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Orders</CardTitle>
          <Button variant="outline" size="sm" onClick={() => router.push('/orders')}>
            View All
          </Button>
        </CardHeader>
        <CardContent>
          {recentOrders.length > 0 ? (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0 cursor-pointer hover:bg-gray-50 p-2 rounded"
                  onClick={() => router.push(`/orders/${order.id}`)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="font-medium text-gray-900">{order.orderNumber}</p>
                      <Badge className={getStatusColor(order.status)} variant="outline">
                        {order.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      {order.tableNumber ? `Table ${order.tableNumber}` : order.orderType} • {order.items.length} items
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(order.createdAt, 'MMM dd, yyyy hh:mm a')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatCurrency(order.totalAmount)}</p>
                    <Badge className={getStatusColor(order.paymentStatus)} variant="outline">
                      {order.paymentStatus}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-gray-500 py-8">No orders yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
