'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Order } from '@/types';
import { subscribeToCollection } from '@/lib/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { orderBy } from 'firebase/firestore';

export default function ReportsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    const unsubscribe = subscribeToCollection<Order>('orders', (data) => {
      setOrders(data);
      setLoading(false);
    }, [orderBy('createdAt', 'desc')]);

    return () => unsubscribe();
  }, [user, router]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thisWeek = new Date();
  thisWeek.setDate(thisWeek.getDate() - 7);
  const thisMonth = new Date();
  thisMonth.setDate(1);

  const todayOrders = orders.filter((o) => o.createdAt.toDate() >= today);
  const weekOrders = orders.filter((o) => o.createdAt.toDate() >= thisWeek);
  const monthOrders = orders.filter((o) => o.createdAt.toDate() >= thisMonth);

  const todayRevenue = todayOrders.filter((o) => o.paymentStatus === 'paid').reduce((sum, o) => sum + o.totalAmount, 0);
  const weekRevenue = weekOrders.filter((o) => o.paymentStatus === 'paid').reduce((sum, o) => sum + o.totalAmount, 0);
  const monthRevenue = monthOrders.filter((o) => o.paymentStatus === 'paid').reduce((sum, o) => sum + o.totalAmount, 0);

  const itemCounts: Record<string, number> = {};
  orders.forEach((order) => {
    order.items.forEach((item) => {
      itemCounts[item.itemName] = (itemCounts[item.itemName] || 0) + item.quantity;
    });
  });

  const topItems = Object.entries(itemCounts).sort(([, a], [, b]) => b - a).slice(0, 10);

  if (loading) return <div className="flex items-center justify-center h-96"><p>Loading...</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-sm text-gray-600">Business insights and performance metrics</p>
        </div>
        <Button>Download PDF</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-sm">Today's Revenue</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-green-600">{formatCurrency(todayRevenue)}</p><p className="text-sm text-gray-600">{todayOrders.length} orders</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">This Week</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-blue-600">{formatCurrency(weekRevenue)}</p><p className="text-sm text-gray-600">{weekOrders.length} orders</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">This Month</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-purple-600">{formatCurrency(monthRevenue)}</p><p className="text-sm text-gray-600">{monthOrders.length} orders</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Top 10 Best-Selling Items</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topItems.map(([name, count], index) => (
              <div key={name} className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">{index + 1}</div>
                  <span className="font-medium">{name}</span>
                </div>
                <span className="font-bold text-gray-900">{count} sold</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Payment Methods</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between"><span>Cash</span><span className="font-semibold">{orders.filter((o) => o.paymentMethod === 'cash').length}</span></div>
              <div className="flex justify-between"><span>UPI</span><span className="font-semibold">{orders.filter((o) => o.paymentMethod === 'upi').length}</span></div>
              <div className="flex justify-between"><span>Card</span><span className="font-semibold">{orders.filter((o) => o.paymentMethod === 'card').length}</span></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Order Types</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between"><span>Dine-in</span><span className="font-semibold">{orders.filter((o) => o.orderType === 'dine-in').length}</span></div>
              <div className="flex justify-between"><span>Takeaway</span><span className="font-semibold">{orders.filter((o) => o.orderType === 'takeaway').length}</span></div>
              <div className="flex justify-between"><span>Delivery</span><span className="font-semibold">{orders.filter((o) => o.orderType === 'delivery').length}</span></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
