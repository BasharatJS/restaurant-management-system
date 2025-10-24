'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Customer } from '@/types';
import { subscribeToCollection, addDocument, updateDocument, deleteDocument } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Timestamp } from 'firebase/firestore';
import { toast } from 'sonner';

export default function CustomersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });

  useEffect(() => {
    if (user && !['admin', 'waiter'].includes(user.role)) {
      router.push('/dashboard');
      return;
    }

    const unsubscribe = subscribeToCollection<Customer>('customers', (data) => {
      setCustomers(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, router]);

  const handleAdd = () => {
    setEditingCustomer(null);
    setFormData({ name: '', phone: '', email: '', address: '' });
    setDialogOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address || '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const data: any = {
        name: formData.name,
        phone: formData.phone,
        totalOrders: editingCustomer?.totalOrders || 0,
        totalSpent: editingCustomer?.totalSpent || 0,
        lastVisit: editingCustomer?.lastVisit || Timestamp.now(),
        loyaltyPoints: editingCustomer?.loyaltyPoints || 0,
      };

      // Only add email and address if they exist
      if (formData.email && formData.email.trim() !== '') {
        data.email = formData.email.trim();
      }
      if (formData.address && formData.address.trim() !== '') {
        data.address = formData.address.trim();
      }

      if (editingCustomer) {
        await updateDocument('customers', editingCustomer.id, data);
        toast.success('Customer updated successfully');
      } else {
        await addDocument('customers', data);
        toast.success('Customer added successfully');
      }

      setDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save customer');
    }
  };

  const handleDelete = async (customer: Customer) => {
    if (!confirm(`Are you sure you want to delete ${customer.name}?`)) return;

    try {
      await deleteDocument('customers', customer.id);
      toast.success('Customer deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete customer');
    }
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-600">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customer Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage customer database and loyalty program
          </p>
        </div>
        <Button onClick={handleAdd}>
          <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Customer
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{customers.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {formatCurrency(customers.reduce((sum, c) => sum + c.totalSpent, 0))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Avg Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {formatCurrency(
                customers.length > 0
                  ? customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length
                  : 0
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Input
        placeholder="Search by name or phone..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="max-w-md"
      />

      {/* Customers Grid */}
      {filteredCustomers.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCustomers.map((customer) => (
            <Card key={customer.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{customer.name}</CardTitle>
                    <p className="text-sm text-gray-600">{customer.phone}</p>
                  </div>
                  <Badge className="bg-purple-100 text-purple-800">
                    {customer.loyaltyPoints} pts
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-500">Orders</p>
                    <p className="font-semibold">{customer.totalOrders}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Total Spent</p>
                    <p className="font-semibold">{formatCurrency(customer.totalSpent)}</p>
                  </div>
                </div>

                {customer.lastVisit && (
                  <p className="text-xs text-gray-500">
                    Last visit: {formatDate(customer.lastVisit, 'MMM dd, yyyy')}
                  </p>
                )}

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(customer)} className="flex-1">
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(customer)}
                    className="flex-1 text-red-600 hover:text-red-700"
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="mt-2 text-sm font-medium text-gray-900">No customers</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding a new customer.</p>
          <div className="mt-6">
            <Button onClick={handleAdd}>Add Customer</Button>
          </div>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCustomer ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingCustomer ? 'Update Customer' : 'Add Customer'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
