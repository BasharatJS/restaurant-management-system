'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Table } from '@/types';
import { subscribeToCollection, addDocument, updateDocument, deleteDocument } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TableCard } from '@/components/tables/table-card';
import { toast } from 'sonner';
import { TABLE_STATUS } from '@/lib/constants';

export default function TablesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [formData, setFormData] = useState({
    tableNumber: '',
    capacity: '',
    section: '',
  });

  useEffect(() => {
    if (user && !['admin', 'waiter'].includes(user.role)) {
      router.push('/dashboard');
      return;
    }

    const unsubscribe = subscribeToCollection<Table>('tables', (data) => {
      setTables(data.sort((a, b) => a.tableNumber - b.tableNumber));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, router]);

  const handleAdd = () => {
    setEditingTable(null);
    setFormData({ tableNumber: '', capacity: '4', section: '' });
    setDialogOpen(true);
  };

  const handleEdit = (table: Table) => {
    setEditingTable(table);
    setFormData({
      tableNumber: table.tableNumber.toString(),
      capacity: table.capacity.toString(),
      section: table.section || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (table: Table) => {
    if (!confirm(`Are you sure you want to delete Table ${table.tableNumber}?`)) return;

    try {
      await deleteDocument('tables', table.id);
      toast.success('Table deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete table');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const data: any = {
        tableNumber: parseInt(formData.tableNumber),
        capacity: parseInt(formData.capacity),
        status: 'available' as const,
        currentOrderId: null,
      };

      // Only include section if it has a value
      if (formData.section && formData.section.trim() !== '') {
        data.section = formData.section.trim();
      }

      if (editingTable) {
        await updateDocument('tables', editingTable.id, data);
        toast.success('Table updated successfully');
      } else {
        await addDocument('tables', data);
        toast.success('Table added successfully');
      }

      setDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save table');
    }
  };

  const handleTableClick = (table: Table) => {
    setSelectedTable(table);
    setActionDialogOpen(true);
  };

  const handleChangeStatus = async (status: 'available' | 'occupied' | 'reserved') => {
    if (!selectedTable) return;

    try {
      await updateDocument('tables', selectedTable.id, {
        status,
        ...(status === 'available' && { currentOrderId: null }),
      });
      toast.success(`Table ${selectedTable.tableNumber} marked as ${status}`);
      setActionDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update table status');
    }
  };

  const handleCreateOrder = () => {
    if (selectedTable) {
      router.push(`/dashboard/orders/new?tableId=${selectedTable.id}`);
    }
  };

  const handleViewOrder = () => {
    if (selectedTable?.currentOrderId) {
      router.push(`/dashboard/orders/${selectedTable.currentOrderId}`);
    }
  };

  const availableCount = tables.filter((t) => t.status === 'available').length;
  const occupiedCount = tables.filter((t) => t.status === 'occupied').length;
  const reservedCount = tables.filter((t) => t.status === 'reserved').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-600">Loading tables...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Table Management</h1>
          <p className="mt-1 text-sm text-gray-600">Manage restaurant tables and their status</p>
        </div>
        {user?.role === 'admin' && (
          <Button onClick={handleAdd}>
            <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Table
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-medium text-green-800">Available</p>
          <p className="mt-2 text-3xl font-bold text-green-900">{availableCount}</p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">Occupied</p>
          <p className="mt-2 text-3xl font-bold text-red-900">{occupiedCount}</p>
        </div>
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm font-medium text-yellow-800">Reserved</p>
          <p className="mt-2 text-3xl font-bold text-yellow-900">{reservedCount}</p>
        </div>
      </div>

      {/* Tables Grid */}
      {tables.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tables.map((table) => (
            <TableCard key={table.id} table={table} onClick={handleTableClick} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="mt-2 text-sm font-medium text-gray-900">No tables</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding a new table.</p>
          {user?.role === 'admin' && (
            <div className="mt-6">
              <Button onClick={handleAdd}>
                <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Table
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTable ? 'Edit Table' : 'Add Table'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tableNumber">Table Number *</Label>
              <Input
                id="tableNumber"
                type="number"
                value={formData.tableNumber}
                onChange={(e) => setFormData({ ...formData, tableNumber: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity (seats) *</Label>
              <Input
                id="capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="section">Section (optional)</Label>
              <Input
                id="section"
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                placeholder="e.g., Indoor, Outdoor, VIP"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingTable ? 'Update Table' : 'Add Table'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Table Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Table {selectedTable?.tableNumber} Actions</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border p-4 space-y-2">
              <p className="text-sm font-medium">Current Status</p>
              <p className="text-2xl font-bold capitalize">{selectedTable?.status}</p>
            </div>

            <div className="space-y-2">
              {selectedTable?.status === 'available' && (
                <Button onClick={handleCreateOrder} className="w-full">
                  <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create New Order
                </Button>
              )}

              {selectedTable?.status === 'occupied' && selectedTable.currentOrderId && (
                <Button onClick={handleViewOrder} className="w-full">
                  <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View Current Order
                </Button>
              )}

              <div className="pt-2 border-t">
                <p className="text-sm font-medium mb-2">Change Status</p>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleChangeStatus('available')}
                    disabled={selectedTable?.status === 'available'}
                  >
                    Available
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleChangeStatus('occupied')}
                    disabled={selectedTable?.status === 'occupied'}
                  >
                    Occupied
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleChangeStatus('reserved')}
                    disabled={selectedTable?.status === 'reserved'}
                  >
                    Reserved
                  </Button>
                </div>
              </div>

              {user?.role === 'admin' && (
                <div className="pt-2 border-t space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setActionDialogOpen(false);
                      if (selectedTable) handleEdit(selectedTable);
                    }}
                    className="w-full"
                  >
                    Edit Table
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setActionDialogOpen(false);
                      if (selectedTable) handleDelete(selectedTable);
                    }}
                    className="w-full text-red-600 hover:text-red-700"
                  >
                    Delete Table
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
