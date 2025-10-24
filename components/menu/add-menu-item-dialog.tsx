'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { MenuItem, MenuCategory } from '@/types';
import { addDocument, updateDocument, getAllDocuments } from '@/lib/firestore';
import { Timestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { GST_RATES } from '@/lib/constants';

interface AddMenuItemDialogProps {
  open: boolean;
  onClose: () => void;
  item?: MenuItem | null;
  onSuccess: () => void;
}

export function AddMenuItemDialog({ open, onClose, item, onSuccess }: AddMenuItemDialogProps) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    gstRate: '5',
    preparationTime: '',
    isVeg: true,
    isAvailable: true,
    image: '',
  });

  useEffect(() => {
    // Load categories
    getAllDocuments<MenuCategory>('menuCategories').then(setCategories);

    // If editing, populate form
    if (item) {
      setFormData({
        name: item.name,
        description: item.description,
        price: item.price.toString(),
        category: item.category,
        gstRate: item.gstRate.toString(),
        preparationTime: item.preparationTime.toString(),
        isVeg: item.isVeg,
        isAvailable: item.isAvailable,
        image: item.image || '',
      });
    } else {
      // Reset form for new item
      setFormData({
        name: '',
        description: '',
        price: '',
        category: '',
        gstRate: '5',
        preparationTime: '',
        isVeg: true,
        isAvailable: true,
        image: '',
      });
    }
  }, [item, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const itemData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        gstRate: parseInt(formData.gstRate),
        preparationTime: parseInt(formData.preparationTime),
        isVeg: formData.isVeg,
        isAvailable: formData.isAvailable,
        image: formData.image,
      };

      if (item?.id) {
        // Update existing item
        await updateDocument('menuItems', item.id, itemData);
        toast.success('Menu item updated successfully');
      } else {
        // Add new item
        await addDocument('menuItems', itemData);
        toast.success('Menu item added successfully');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save menu item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? 'Edit Menu Item' : 'Add Menu Item'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Item Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price (₹) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gstRate">GST Rate *</Label>
              <Select value={formData.gstRate} onValueChange={(value) => setFormData({ ...formData, gstRate: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GST_RATES.map((rate) => (
                    <SelectItem key={rate} value={rate.toString()}>
                      {rate}%
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prepTime">Prep Time (mins) *</Label>
              <Input
                id="prepTime"
                type="number"
                value={formData.preparationTime}
                onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Image URL</Label>
            <Input
              id="image"
              type="url"
              placeholder="https://example.com/image.jpg"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-between py-2 border-t">
            <Label htmlFor="isVeg">Vegetarian</Label>
            <Switch
              id="isVeg"
              checked={formData.isVeg}
              onCheckedChange={(checked) => setFormData({ ...formData, isVeg: checked })}
            />
          </div>

          <div className="flex items-center justify-between py-2 border-t">
            <Label htmlFor="isAvailable">Available</Label>
            <Switch
              id="isAvailable"
              checked={formData.isAvailable}
              onCheckedChange={(checked) => setFormData({ ...formData, isAvailable: checked })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : item ? 'Update Item' : 'Add Item'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
