'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Staff } from '@/types';
import { subscribeToCollection, addDocument, updateDocument, deleteDocument } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { formatDate } from '@/lib/utils';
import { Timestamp } from 'firebase/firestore';
import { toast } from 'sonner';

export default function StaffPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    role: 'waiter' as 'admin' | 'waiter' | 'kitchen',
    phone: '',
    email: '',
    salary: '',
    isActive: true,
  });

  useEffect(() => {
    if (user?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    const unsubscribe = subscribeToCollection<Staff>('staff', (data) => {
      setStaff(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, router]);

  const handleAdd = () => {
    setEditingStaff(null);
    setFormData({ name: '', role: 'waiter', phone: '', email: '', salary: '', isActive: true });
    setDialogOpen(true);
  };

  const handleEdit = (staffMember: Staff) => {
    setEditingStaff(staffMember);
    setFormData({
      name: staffMember.name,
      role: staffMember.role,
      phone: staffMember.phone,
      email: staffMember.email,
      salary: staffMember.salary?.toString() || '',
      isActive: staffMember.isActive,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const data = {
        name: formData.name,
        role: formData.role,
        phone: formData.phone,
        email: formData.email,
        salary: formData.salary ? parseFloat(formData.salary) : undefined,
        isActive: formData.isActive,
        joiningDate: editingStaff?.joiningDate || Timestamp.now(),
      };

      if (editingStaff) {
        await updateDocument('staff', editingStaff.id, data);
        toast.success('Staff updated successfully');
      } else {
        await addDocument('staff', data);
        toast.success('Staff added successfully');
      }

      setDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save staff');
    }
  };

  const handleDelete = async (staffMember: Staff) => {
    if (!confirm(`Are you sure you want to delete ${staffMember.name}?`)) return;

    try {
      await deleteDocument('staff', staffMember.id);
      toast.success('Staff deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete staff');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'waiter':
        return 'bg-blue-100 text-blue-800';
      case 'kitchen':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-600">Loading staff...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
          <p className="mt-1 text-sm text-gray-600">Manage restaurant staff and roles</p>
        </div>
        <Button onClick={handleAdd}>
          <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Staff
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Total Staff</p>
            <p className="text-2xl font-bold">{staff.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Active</p>
            <p className="text-2xl font-bold text-green-600">
              {staff.filter((s) => s.isActive).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Waiters</p>
            <p className="text-2xl font-bold">{staff.filter((s) => s.role === 'waiter').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Kitchen</p>
            <p className="text-2xl font-bold">{staff.filter((s) => s.role === 'kitchen').length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Staff Grid */}
      {staff.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {staff.map((staffMember) => (
            <Card key={staffMember.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{staffMember.name}</CardTitle>
                    <p className="text-sm text-gray-600">{staffMember.phone}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Badge className={getRoleBadgeColor(staffMember.role)}>
                      {staffMember.role}
                    </Badge>
                    {staffMember.isActive ? (
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800">Inactive</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <p className="text-gray-500">Email</p>
                  <p className="font-medium">{staffMember.email}</p>
                </div>

                <div className="text-sm">
                  <p className="text-gray-500">Joining Date</p>
                  <p className="font-medium">{formatDate(staffMember.joiningDate, 'MMM dd, yyyy')}</p>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(staffMember)} className="flex-1">
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(staffMember)}
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
          <h3 className="mt-2 text-sm font-medium text-gray-900">No staff members</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding a new staff member.</p>
          <div className="mt-6">
            <Button onClick={handleAdd}>Add Staff</Button>
          </div>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingStaff ? 'Edit Staff' : 'Add Staff'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
                <Label htmlFor="role">Role *</Label>
                <Select value={formData.role} onValueChange={(value: any) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="waiter">Waiter</SelectItem>
                    <SelectItem value="kitchen">Kitchen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="salary">Salary (optional)</Label>
              <Input
                id="salary"
                type="number"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
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
              <Button type="submit">{editingStaff ? 'Update Staff' : 'Add Staff'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
