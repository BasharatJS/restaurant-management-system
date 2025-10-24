'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { MenuCategory } from '@/types';
import { subscribeToCollection, addDocument, updateDocument, deleteDocument } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export default function CategoriesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [formData, setFormData] = useState({ name: '', order: '0', isActive: true });

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    const unsubscribe = subscribeToCollection<MenuCategory>('menuCategories', (data) => {
      setCategories(data.sort((a, b) => a.order - b.order));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, router]);

  const handleAdd = () => {
    setEditingCategory(null);
    setFormData({ name: '', order: categories.length.toString(), isActive: true });
    setDialogOpen(true);
  };

  const handleEdit = (category: MenuCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      order: category.order.toString(),
      isActive: category.isActive,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (category: MenuCategory) => {
    if (!confirm(`Are you sure you want to delete "${category.name}"?`)) return;

    try {
      await deleteDocument('menuCategories', category.id);
      toast.success('Category deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete category');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const data = {
        name: formData.name,
        order: parseInt(formData.order),
        isActive: formData.isActive,
      };

      if (editingCategory) {
        await updateDocument('menuCategories', editingCategory.id, data);
        toast.success('Category updated successfully');
      } else {
        await addDocument('menuCategories', data);
        toast.success('Category added successfully');
      }

      setDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save category');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-600">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Menu Categories</h1>
          <p className="mt-1 text-sm text-gray-600">Organize your menu items into categories</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/dashboard/menu')}>
            Back to Menu
          </Button>
          <Button onClick={handleAdd}>
            <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Category
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Card key={category.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{category.name}</span>
                {category.isActive ? (
                  <span className="text-xs font-normal text-green-600">Active</span>
                ) : (
                  <span className="text-xs font-normal text-red-600">Inactive</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">Display Order: {category.order}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(category)} className="flex-1">
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(category)}
                  className="flex-1 text-red-600 hover:text-red-700"
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-12">
          <h3 className="mt-2 text-sm font-medium text-gray-900">No categories</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding a new category.</p>
          <div className="mt-6">
            <Button onClick={handleAdd}>
              <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Category
            </Button>
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Category Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="order">Display Order *</Label>
              <Input
                id="order"
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                required
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <Label htmlFor="isActive">Active</Label>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingCategory ? 'Update Category' : 'Add Category'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
