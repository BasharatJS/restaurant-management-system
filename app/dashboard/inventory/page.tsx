'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { InventoryItem } from '@/types';
import { subscribeToCollection, addDocument, updateDocument, deleteDocument } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Timestamp } from 'firebase/firestore';
import { toast } from 'sonner';

export default function InventoryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    unit: '',
    currentStock: '',
    minimumStock: '',
    price: '',
    supplier: '',
  });

  useEffect(() => {
    if (user?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    const unsubscribe = subscribeToCollection<InventoryItem>('inventory', (data) => {
      setItems(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        name: formData.name,
        unit: formData.unit,
        currentStock: parseFloat(formData.currentStock),
        minimumStock: parseFloat(formData.minimumStock),
        price: parseFloat(formData.price),
        supplier: formData.supplier,
        lastPurchaseDate: Timestamp.now(),
      };

      if (editingItem) {
        await updateDocument('inventory', editingItem.id, data);
        toast.success('Inventory updated');
      } else {
        await addDocument('inventory', data);
        toast.success('Item added');
      }
      setDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const lowStockItems = items.filter((item) => item.currentStock <= item.minimumStock);

  if (loading) return <div className="flex items-center justify-center h-96"><p>Loading...</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-sm text-gray-600">Track raw materials and supplies</p>
        </div>
        <Button onClick={() => { setEditingItem(null); setFormData({ name: '', unit: '', currentStock: '', minimumStock: '', price: '', supplier: '' }); setDialogOpen(true); }}>
          Add Item
        </Button>
      </div>

      {lowStockItems.length > 0 && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <p className="font-semibold text-red-800">⚠️ Low Stock Alert: {lowStockItems.length} items need restocking</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Card key={item.id} className={item.currentStock <= item.minimumStock ? 'border-red-300' : ''}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold">{item.name}</h3>
                {item.currentStock <= item.minimumStock && <Badge className="bg-red-600">Low Stock</Badge>}
              </div>
              <div className="space-y-1 text-sm">
                <p>Stock: <span className="font-semibold">{item.currentStock} {item.unit}</span></p>
                <p>Min: {item.minimumStock} {item.unit}</p>
                <p>Price: ₹{item.price}/{item.unit}</p>
                <p className="text-gray-500">Supplier: {item.supplier}</p>
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline" onClick={() => { setEditingItem(item); setFormData({ name: item.name, unit: item.unit, currentStock: item.currentStock.toString(), minimumStock: item.minimumStock.toString(), price: item.price.toString(), supplier: item.supplier }); setDialogOpen(true); }} className="flex-1">Edit</Button>
                <Button size="sm" variant="outline" onClick={async () => { if (confirm('Delete?')) { await deleteDocument('inventory', item.id); toast.success('Deleted'); } }} className="flex-1 text-red-600">Delete</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingItem ? 'Edit' : 'Add'} Inventory Item</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2"><Label>Name *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Unit *</Label><Input value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} placeholder="kg, liter, pieces" required /></div>
              <div className="space-y-2"><Label>Price *</Label><Input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Current Stock *</Label><Input type="number" step="0.01" value={formData.currentStock} onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Min Stock *</Label><Input type="number" step="0.01" value={formData.minimumStock} onChange={(e) => setFormData({ ...formData, minimumStock: e.target.value })} required /></div>
            </div>
            <div className="space-y-2"><Label>Supplier</Label><Input value={formData.supplier} onChange={(e) => setFormData({ ...formData, supplier: e.target.value })} /></div>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button type="submit">Save</Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
