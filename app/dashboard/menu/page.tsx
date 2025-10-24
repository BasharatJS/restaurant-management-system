'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MenuItem, MenuCategory } from '@/types';
import { subscribeToCollection, updateDocument, deleteDocument } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MenuItemCard } from '@/components/menu/menu-item-card';
import { AddMenuItemDialog } from '@/components/menu/add-menu-item-dialog';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function MenuPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    // Redirect if not admin
    if (user && user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    setLoading(true);

    // Subscribe to menu items
    const unsubscribeItems = subscribeToCollection<MenuItem>('menuItems', (data) => {
      setMenuItems(data);
      setLoading(false);
    });

    // Subscribe to categories
    const unsubscribeCategories = subscribeToCollection<MenuCategory>(
      'menuCategories',
      setCategories
    );

    return () => {
      unsubscribeItems();
      unsubscribeCategories();
    };
  }, [user, router]);

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setDialogOpen(true);
  };

  const handleDelete = async (item: MenuItem) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) {
      return;
    }

    try {
      await deleteDocument('menuItems', item.id);
      toast.success('Menu item deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete menu item');
    }
  };

  const handleToggleAvailability = async (item: MenuItem) => {
    try {
      await updateDocument('menuItems', item.id, {
        isAvailable: !item.isAvailable,
      });
      toast.success(`${item.name} is now ${!item.isAvailable ? 'available' : 'unavailable'}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update availability');
    }
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingItem(null);
  };

  // Filter menu items
  const filteredItems = menuItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Menu Management</h1>
          <p className="mt-1 text-sm text-gray-600">Manage your restaurant menu items and categories</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/dashboard/menu/categories')}>
            Manage Categories
          </Button>
          <Button onClick={handleAddNew}>
            <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Menu Item
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList>
          <TabsTrigger value="all">All Items ({menuItems.length})</TabsTrigger>
          {categories.map((category) => {
            const count = menuItems.filter((item) => item.category === category.id).length;
            return (
              <TabsTrigger key={category.id} value={category.id}>
                {category.name} ({count})
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-6">
          {filteredItems.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredItems.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleAvailability={handleToggleAvailability}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No menu items</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding a new menu item.</p>
              <div className="mt-6">
                <Button onClick={handleAddNew}>
                  <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Menu Item
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add/Edit Dialog */}
      <AddMenuItemDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        item={editingItem}
        onSuccess={() => {}}
      />
    </div>
  );
}
