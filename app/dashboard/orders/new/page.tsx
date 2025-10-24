'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useOrderStore } from '@/store/orderStore';
import { MenuItem, MenuCategory, Table, Customer } from '@/types';
import { subscribeToCollection, addDocument, updateDocument, findCustomerByPhone } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { formatCurrency, calculateOrderTotals, generateOrderNumber } from '@/lib/utils';
import { Timestamp } from 'firebase/firestore';

export default function NewOrderPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tableIdFromQuery = searchParams.get('tableId');

  const {
    items,
    tableId,
    tableNumber,
    customerName,
    customerPhone,
    orderType,
    addItem,
    updateItemQuantity,
    removeItem,
    setTable,
    setCustomer,
    setOrderType,
    clearOrder,
    getTotal,
  } = useOrderStore();

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingCustomer, setExistingCustomer] = useState<Customer | null>(null);
  const [lookingUpCustomer, setLookingUpCustomer] = useState(false);

  useEffect(() => {
    if (user && !['admin', 'waiter'].includes(user.role)) {
      router.push('/dashboard');
      return;
    }

    setLoading(true);

    const unsubscribeItems = subscribeToCollection<MenuItem>('menuItems', (data) => {
      setMenuItems(data.filter((item) => item.isAvailable));
      setLoading(false);
    });

    const unsubscribeCategories = subscribeToCollection<MenuCategory>('menuCategories', (data) => {
      setCategories(data.filter((cat) => cat.isActive));
    });

    const unsubscribeTables = subscribeToCollection<Table>('tables', setTables);

    // Set table from query params
    if (tableIdFromQuery) {
      const table = tables.find((t) => t.id === tableIdFromQuery);
      if (table) {
        setTable(table.id, table.tableNumber);
        setOrderType('dine-in');
      }
    }

    return () => {
      unsubscribeItems();
      unsubscribeCategories();
      unsubscribeTables();
    };
  }, [user, router, tableIdFromQuery]);

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddItem = (menuItem: MenuItem) => {
    addItem(menuItem, 1);
    toast.success(`${menuItem.name} added to order`);
  };

  const handlePhoneChange = async (phone: string) => {
    // Update the phone in store
    setCustomer(customerName, phone);

    // Reset existing customer if phone length changes
    if (phone.length !== 10) {
      setExistingCustomer(null);
      return;
    }

    // Only lookup if phone is exactly 10 digits
    if (phone.length === 10) {
      setLookingUpCustomer(true);
      try {
        const customer = await findCustomerByPhone(phone);
        if (customer) {
          setExistingCustomer(customer);
          setCustomer(customer.name, phone);
          toast.success(`Customer found: ${customer.name} (${customer.loyaltyPoints} points)`);
        } else {
          setExistingCustomer(null);
          toast.info('New customer - Please enter customer name');
        }
      } catch (error) {
        console.error('Error looking up customer:', error);
        setExistingCustomer(null);
        toast.error('Error looking up customer');
      } finally {
        setLookingUpCustomer(false);
      }
    }
  };

  const handleSubmitOrder = async () => {
    if (items.length === 0) {
      toast.error('Please add items to the order');
      return;
    }

    if (orderType === 'dine-in' && !tableId) {
      toast.error('Please select a table for dine-in orders');
      return;
    }

    setSubmitting(true);

    try {
      const totals = calculateOrderTotals(items, 0);
      const orderNumber = generateOrderNumber();

      const orderData: any = {
        orderNumber,
        tableId: orderType === 'dine-in' ? tableId : null,
        tableNumber: orderType === 'dine-in' ? tableNumber : null,
        items: items.map((item) => ({
          itemId: item.itemId,
          itemName: item.itemName,
          quantity: item.quantity,
          price: item.price,
          specialInstructions: item.specialInstructions || '',
          gstRate: item.gstRate,
        })),
        subtotal: totals.subtotal,
        cgst: totals.cgst,
        sgst: totals.sgst,
        totalAmount: totals.totalAmount,
        discount: 0,
        status: 'pending' as const,
        paymentStatus: 'pending' as const,
        paymentMethod: null,
        waiterId: user?.id || '',
        waiterName: user?.name || '',
        createdBy: user?.id || '',
        orderType,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        completedAt: null,
      };

      // Add customer info if available
      if (customerName && customerName.trim() !== '') {
        orderData.customerName = customerName.trim();
      }
      if (customerPhone && customerPhone.trim() !== '') {
        orderData.customerPhone = customerPhone.trim();
      }
      // Store customer ID for automatic stats update later
      if (existingCustomer) {
        orderData.customerId = existingCustomer.id;
      }

      const orderId = await addDocument('orders', orderData);

      // Update table status if dine-in
      if (orderType === 'dine-in' && tableId) {
        await updateDocument('tables', tableId, {
          status: 'occupied',
          currentOrderId: orderId,
        });
      }

      toast.success('Order created successfully!');
      clearOrder();
      setExistingCustomer(null);
      router.push(`/dashboard/orders/${orderId}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  };

  const totals = calculateOrderTotals(items, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex gap-6">
      {/* Menu Section */}
      <div className="flex-1 space-y-4 overflow-y-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">New Order</h1>
          <Button variant="outline" onClick={() => router.push('/dashboard/orders')}>
            Cancel
          </Button>
        </div>

        {/* Order Type & Table Selection */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Order Type</Label>
                <Select value={orderType} onValueChange={(value: any) => setOrderType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dine-in">Dine In</SelectItem>
                    <SelectItem value="takeaway">Takeaway</SelectItem>
                    <SelectItem value="delivery">Delivery</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {orderType === 'dine-in' && (
                <div className="space-y-2">
                  <Label>Table</Label>
                  <Select
                    value={tableId || ''}
                    onValueChange={(value) => {
                      const table = tables.find((t) => t.id === value);
                      if (table) {
                        setTable(table.id, table.tableNumber);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select table" />
                    </SelectTrigger>
                    <SelectContent>
                      {tables
                        .filter((t) => t.status === 'available')
                        .map((table) => (
                          <SelectItem key={table.id} value={table.id}>
                            Table {table.tableNumber}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {(orderType === 'takeaway' || orderType === 'delivery') && (
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Customer Phone *</Label>
                    <Input
                      value={customerPhone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder="Enter 10-digit phone"
                      maxLength={10}
                      disabled={lookingUpCustomer}
                    />
                    {lookingUpCustomer && (
                      <p className="text-xs text-blue-600">Looking up customer...</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Customer Name *</Label>
                    <Input
                      value={customerName}
                      onChange={(e) => setCustomer(e.target.value, customerPhone)}
                      placeholder="Enter customer name"
                      disabled={!!existingCustomer}
                    />
                  </div>
                </div>

                {existingCustomer && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-800">
                          Existing Customer Found!
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          {existingCustomer.totalOrders} orders • Spent {formatCurrency(existingCustomer.totalSpent)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-green-600">Loyalty Points</p>
                        <p className="text-lg font-bold text-green-700">{existingCustomer.loyaltyPoints}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Search */}
        <Input
          placeholder="Search menu items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {/* Categories */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList>
            <TabsTrigger value="all">All Items</TabsTrigger>
            {categories.map((category) => (
              <TabsTrigger key={category.id} value={category.id}>
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Menu Items */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <Card key={item.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleAddItem(item)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mt-1">{item.description}</p>
                    <p className="text-lg font-bold text-blue-600 mt-2">{formatCurrency(item.price)}</p>
                  </div>
                  <Badge className={item.isVeg ? 'bg-green-600' : 'bg-red-600'}>
                    {item.isVeg ? 'V' : 'N'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Order Cart */}
      <Card className="w-96 h-fit sticky top-0">
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-8">No items added yet</p>
          ) : (
            <>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {items.map((item, index) => (
                  <div key={`${item.itemId}-${index}`} className="flex items-start justify-between border-b pb-3">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.itemName}</p>
                      <p className="text-xs text-gray-500">{formatCurrency(item.price)} each</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateItemQuantity(item.itemId, item.quantity - 1)}
                        >
                          -
                        </Button>
                        <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateItemQuantity(item.itemId, item.quantity + 1)}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(item.price * item.quantity)}</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeItem(item.itemId)}
                        className="text-red-600 hover:text-red-700 mt-1"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatCurrency(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>CGST</span>
                  <span>{formatCurrency(totals.cgst)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>SGST</span>
                  <span>{formatCurrency(totals.sgst)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total</span>
                  <span>{formatCurrency(totals.totalAmount)}</span>
                </div>
              </div>

              <Button onClick={handleSubmitOrder} disabled={submitting} className="w-full" size="lg">
                {submitting ? 'Creating Order...' : 'Create Order'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
