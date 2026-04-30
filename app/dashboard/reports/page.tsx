'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Order, Expense, InventoryItem } from '@/types';
import { subscribeToCollection } from '@/lib/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';
import { orderBy, Timestamp } from 'firebase/firestore';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Colors matching app theme (Tailwind palette)
const COLORS = [
  '#3b82f6', // blue-500 (primary - matches sidebar active)
  '#ef4444', // red-500 (expenses/negative)
  '#f97316', // orange-500 (warnings/profit)
  '#22c55e', // green-500 (revenue/positive)
  '#8b5cf6', // purple-500 (accent)
  '#06b6d4', // cyan-500 (info)
  '#f59e0b', // amber-500 (secondary)
];

export default function ReportsPage() {
  const { user } = useAuth();
  const tenantId = user?.tenantId || '';
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [salesPeriod, setSalesPeriod] = useState('7');
  const [profitPeriod, setProfitPeriod] = useState('14');
  const [expensePeriod, setExpensePeriod] = useState('30');
  const [expenseChartType, setExpenseChartType] = useState<'pie' | 'bar'>('pie');

  useEffect(() => {
    if (user?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    const unsubscribeOrders = subscribeToCollection<Order>(tenantId, 'orders', (data) => {
      setOrders(data);
      setLoading(false);
    }, [orderBy('createdAt', 'desc')]);

    const unsubscribeExpenses = subscribeToCollection<Expense>(tenantId, 'expenses', setExpenses, [orderBy('date', 'desc')]);

    const unsubscribeInventory = subscribeToCollection<InventoryItem>(tenantId, 'inventory', setInventory);

    return () => {
      unsubscribeOrders();
      unsubscribeExpenses();
      unsubscribeInventory();
    };
  }, [user, router]);

  // Calculate dates
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);

  // Filter orders and expenses
  const todayOrders = orders.filter((o) => {
    const date = o.createdAt instanceof Timestamp ? o.createdAt.toDate() : new Date(o.createdAt);
    return date >= today;
  });
  const weekOrders = orders.filter((o) => {
    const date = o.createdAt instanceof Timestamp ? o.createdAt.toDate() : new Date(o.createdAt);
    return date >= weekAgo;
  });
  const monthOrders = orders.filter((o) => {
    const date = o.createdAt instanceof Timestamp ? o.createdAt.toDate() : new Date(o.createdAt);
    return date >= monthAgo;
  });

  const todayExpenses = expenses.filter((e) => {
    const date = e.date instanceof Timestamp ? e.date.toDate() : new Date(e.date);
    return date >= today;
  }).reduce((sum, e) => sum + e.amount, 0);

  const weekExpenses = expenses.filter((e) => {
    const date = e.date instanceof Timestamp ? e.date.toDate() : new Date(e.date);
    return date >= weekAgo;
  }).reduce((sum, e) => sum + e.amount, 0);

  const monthExpenses = expenses.filter((e) => {
    const date = e.date instanceof Timestamp ? e.date.toDate() : new Date(e.date);
    return date >= monthAgo;
  }).reduce((sum, e) => sum + e.amount, 0);

  const todayRevenue = todayOrders.filter((o) => o.paymentStatus === 'paid').reduce((sum, o) => sum + o.totalAmount, 0);
  const weekRevenue = weekOrders.filter((o) => o.paymentStatus === 'paid').reduce((sum, o) => sum + o.totalAmount, 0);
  const monthRevenue = monthOrders.filter((o) => o.paymentStatus === 'paid').reduce((sum, o) => sum + o.totalAmount, 0);

  const todayProfit = todayRevenue - todayExpenses;
  const weekProfit = weekRevenue - weekExpenses;
  const monthProfit = monthRevenue - monthExpenses;

  const todayMargin = todayRevenue > 0 ? (todayProfit / todayRevenue) * 100 : 0;
  const weekMargin = weekRevenue > 0 ? (weekProfit / weekRevenue) * 100 : 0;
  const monthMargin = monthRevenue > 0 ? (monthProfit / monthRevenue) * 100 : 0;

  // Sales Trends Data (Last 7 or 30 days)
  const salesDays = parseInt(salesPeriod);
  const salesTrendsData = Array.from({ length: salesDays }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (salesDays - 1 - i));
    date.setHours(0, 0, 0, 0);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    const dayOrders = orders.filter((o) => {
      const orderDate = o.createdAt instanceof Timestamp ? o.createdAt.toDate() : new Date(o.createdAt);
      return orderDate >= date && orderDate < nextDay && o.paymentStatus === 'paid';
    });

    const dayExpenses = expenses.filter((e) => {
      const expDate = e.date instanceof Timestamp ? e.date.toDate() : new Date(e.date);
      return expDate >= date && expDate < nextDay;
    });

    const revenue = dayOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const expense = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
    const profit = revenue - expense;

    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      Revenue: revenue,
      Expenses: expense,
      Profit: profit,
    };
  });

  // Profit Analysis Data
  const profitDays = parseInt(profitPeriod);
  const profitAnalysisData = Array.from({ length: profitDays }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (profitDays - 1 - i));
    date.setHours(0, 0, 0, 0);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    const dayOrders = orders.filter((o) => {
      const orderDate = o.createdAt instanceof Timestamp ? o.createdAt.toDate() : new Date(o.createdAt);
      return orderDate >= date && orderDate < nextDay && o.paymentStatus === 'paid';
    });

    const dayExpenses = expenses.filter((e) => {
      const expDate = e.date instanceof Timestamp ? e.date.toDate() : new Date(e.date);
      return expDate >= date && expDate < nextDay;
    });

    const revenue = dayOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const expense = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
    const profit = revenue - expense;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      Revenue: revenue,
      Expenses: expense,
      'Net Profit': profit,
      'Profit Margin %': margin,
    };
  });

  // Expense Breakdown by Category (with period filter)
  const expenseDays = parseInt(expensePeriod);
  const expensePeriodStart = new Date();
  if (expensePeriod === '0') {
    // Today
    expensePeriodStart.setHours(0, 0, 0, 0);
  } else {
    expensePeriodStart.setDate(expensePeriodStart.getDate() - expenseDays);
  }

  const filteredExpenses = expenses.filter((e) => {
    const date = e.date instanceof Timestamp ? e.date.toDate() : new Date(e.date);
    return date >= expensePeriodStart;
  });

  const expenseByCategory: Record<string, number> = {};
  filteredExpenses.forEach((exp) => {
    expenseByCategory[exp.category] = (expenseByCategory[exp.category] || 0) + exp.amount;
  });

  const expenseBreakdownData = Object.entries(expenseByCategory).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  // Inventory Calculations
  const totalInventoryItems = inventory.length;
  const lowStockItems = inventory.filter(item => item.currentStock <= item.minimumStock);
  const outOfStockItems = inventory.filter(item => item.currentStock === 0);
  const totalInventoryValue = inventory.reduce((sum, item) => sum + (item.currentStock * item.price), 0);

  // Inventory Stock Levels Data (for bar chart)
  const inventoryStockData = inventory
    .sort((a, b) => (a.currentStock / a.minimumStock) - (b.currentStock / b.minimumStock))
    .slice(0, 10)
    .map(item => ({
      name: item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name,
      'Current Stock': item.currentStock,
      'Minimum Stock': item.minimumStock,
    }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="mt-1 text-sm text-gray-600">Track revenue, expenses, and profitability</p>
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </Button>
      </div>

      {/* Profit Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-600">Today's Profit</p>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Revenue:</span>
                <span className="font-semibold text-green-600">{formatCurrency(todayRevenue)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Expenses:</span>
                <span className="font-semibold text-red-600">{formatCurrency(todayExpenses)}</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">Net Profit:</span>
                  <span className="text-lg font-bold text-green-600">{formatCurrency(todayProfit)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Orders: {todayOrders.length}</span>
                <span className="text-green-600 font-semibold">Margin: {todayMargin.toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-600">Weekly Profit (7 days)</p>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Revenue:</span>
                <span className="font-semibold text-green-600">{formatCurrency(weekRevenue)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Expenses:</span>
                <span className="font-semibold text-red-600">{formatCurrency(weekExpenses)}</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">Net Profit:</span>
                  <span className="text-lg font-bold text-green-600">{formatCurrency(weekProfit)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Orders: {weekOrders.length}</span>
                <span className="text-green-600 font-semibold">Margin: {weekMargin.toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-600">Monthly Profit (30 days)</p>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Revenue:</span>
                <span className="font-semibold text-green-600">{formatCurrency(monthRevenue)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Expenses:</span>
                <span className="font-semibold text-red-600">{formatCurrency(monthExpenses)}</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">Net Profit:</span>
                  <span className="text-lg font-bold text-green-600">{formatCurrency(monthProfit)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Orders: {monthOrders.length}</span>
                <span className="text-green-600 font-semibold">Margin: {monthMargin.toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Trends Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Sales Trends</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={salesPeriod} onValueChange={setSalesPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="14">Last 14 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesTrendsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Legend />
              <Line type="monotone" dataKey="Revenue" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="Expenses" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="Profit" stroke="#f97316" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Expense Breakdown & Profit Analysis */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Expense Breakdown */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Expense Breakdown</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={expensePeriod} onValueChange={setExpensePeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Today</SelectItem>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-1 border rounded-md">
                <Button
                  variant={expenseChartType === 'pie' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setExpenseChartType('pie')}
                  className="rounded-r-none"
                >
                  Pie
                </Button>
                <Button
                  variant={expenseChartType === 'bar' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setExpenseChartType('bar')}
                  className="rounded-l-none"
                >
                  Bar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {expenseBreakdownData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                {expenseChartType === 'pie' ? (
                  <PieChart>
                    <Pie
                      data={expenseBreakdownData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(props: any) => {
                        const { name, percent } = props;
                        return `${name}: ${(percent * 100).toFixed(0)}%`;
                      }}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {expenseBreakdownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  </PieChart>
                ) : (
                  <BarChart data={expenseBreakdownData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                    <Bar dataKey="value" name="Amount">
                      {expenseBreakdownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <svg className="w-16 h-16 mb-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                </svg>
                <p className="text-sm font-medium">No expense data available</p>
                <p className="text-xs mt-1">Add expenses to see breakdown</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profit Analysis */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Profit Analysis</CardTitle>
            <Select value={profitPeriod} onValueChange={setProfitPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="14">14 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={profitAnalysisData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="Expenses" fill="#ef4444" />
                <Line yAxisId="left" type="monotone" dataKey="Net Profit" stroke="#f97316" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="Profit Margin %" stroke="#8b5cf6" strokeWidth={2} />
                <Bar yAxisId="left" dataKey="Revenue" fill="#22c55e" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-3xl font-bold text-green-600">{formatCurrency(monthRevenue)}</p>
            <p className="text-sm text-gray-600 mt-1">Total Revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-3xl font-bold text-red-600">{formatCurrency(monthExpenses)}</p>
            <p className="text-sm text-gray-600 mt-1">Total Expenses</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-3xl font-bold text-orange-600">{formatCurrency(monthProfit)}</p>
            <p className="text-sm text-gray-600 mt-1">Total Profit</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-3xl font-bold text-blue-600">{monthMargin.toFixed(1)}%</p>
            <p className="text-sm text-gray-600 mt-1">Avg Margin</p>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Overview Section */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Inventory Overview</h2>
            <p className="text-sm text-gray-600 mt-1">Monitor stock levels and inventory value</p>
          </div>
          <Button variant="outline" onClick={() => router.push('/dashboard/inventory')}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Manage Inventory
          </Button>
        </div>

        {/* Inventory Summary Cards */}
        <div className="grid gap-6 md:grid-cols-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Items</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">{totalInventoryItems}</p>
                </div>
                <div className="rounded-full bg-blue-100 p-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={lowStockItems.length > 0 ? "border-2 border-yellow-400" : ""}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Low Stock</p>
                  <p className="text-3xl font-bold text-yellow-600 mt-2">{lowStockItems.length}</p>
                </div>
                <div className="rounded-full bg-yellow-100 p-3">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={outOfStockItems.length > 0 ? "border-2 border-red-400" : ""}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                  <p className="text-3xl font-bold text-red-600 mt-2">{outOfStockItems.length}</p>
                </div>
                <div className="rounded-full bg-red-100 p-3">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Inventory Value</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{formatCurrency(totalInventoryValue)}</p>
                </div>
                <div className="rounded-full bg-green-100 p-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Inventory Stock Levels Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Stock Levels (Top 10 Items)</CardTitle>
          </CardHeader>
          <CardContent>
            {inventoryStockData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={inventoryStockData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Current Stock" fill="#3b82f6" />
                  <Bar dataKey="Minimum Stock" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <svg className="w-16 h-16 mb-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p className="text-sm font-medium">No inventory data available</p>
                <p className="text-xs mt-1">Add inventory items to see stock levels</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alert List */}
        {lowStockItems.length > 0 && (
          <Card className="mt-6 bg-yellow-50 border-2 border-yellow-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-900">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Items Requiring Attention ({lowStockItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {lowStockItems.map((item) => (
                  <div key={item.id} className="bg-white rounded-lg p-4 border border-yellow-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{item.name}</h4>
                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                        {item.currentStock === 0 ? 'Out' : 'Low'}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-600">
                        Current: <span className="font-bold text-yellow-700">{item.currentStock} {item.unit}</span>
                      </p>
                      <p className="text-gray-600">
                        Minimum: <span className="font-medium">{item.minimumStock} {item.unit}</span>
                      </p>
                      <p className="text-gray-500 text-xs">Supplier: {item.supplier}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
