'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { TenantUser } from '@/types';
import { TenantService } from '@/lib/tenant';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { StatsCard } from '@/components/dashboard/stats-card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

export default function StaffPage() {
  const { user, createStaff } = useAuth();
  const tenantId = user?.tenantId || '';
  const router = useRouter();
  const [staff, setStaff] = useState<TenantUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<TenantUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmState, setConfirmState] = useState<{ open: boolean; staff: TenantUser | null }>({ open: false, staff: null });
  const [formData, setFormData] = useState({
    name: '',
    role: 'waiter' as 'admin' | 'waiter' | 'kitchen',
    phone: '',
    email: '',
    password: '',
    isActive: true,
  });

  useEffect(() => {
    if (user?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    if (!tenantId) return;

    // ✅ Subscribe to tenants/{tenantId}/users — same place createStaff() writes to
    const usersRef = collection(db, 'tenants', tenantId, 'users');
    const unsubscribe = onSnapshot(usersRef, (snap) => {
      const users = snap.docs.map(d => ({ id: d.id, ...d.data() } as TenantUser));
      // Show all staff (including admin if desired, or filter to non-owner)
      setStaff(users);
      setLoading(false);
    }, (err) => {
      console.error('Staff subscription error:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, router, tenantId]);

  const handleAdd = () => {
    setEditingStaff(null);
    setFormData({ name: '', role: 'waiter', phone: '', email: '', password: '', isActive: true });
    setDialogOpen(true);
  };

  const handleEdit = (staffMember: TenantUser) => {
    setEditingStaff(staffMember);
    setFormData({
      name: staffMember.name,
      role: staffMember.role as 'admin' | 'waiter' | 'kitchen',
      phone: staffMember.phone || '',
      email: staffMember.email,
      password: '',
      isActive: staffMember.isActive,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingStaff) {
        // Edit: update the tenants/{tenantId}/users record via TenantService
        await TenantService.updateStaffUser(tenantId, editingStaff.id!, {
          name: formData.name,
          role: formData.role,
          phone: formData.phone || undefined,
          isActive: formData.isActive,
        });
        toast.success('Staff updated successfully');
      } else {
        // New staff: use createStaff which creates Firebase Auth + Firestore record
        if (!formData.password || formData.password.length < 6) {
          toast.error('Password must be at least 6 characters');
          setSaving(false);
          return;
        }
        await createStaff({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          phone: formData.phone,
        });
        toast.success(`✅ ${formData.name} added! They can now login with their email & password.`);
      }
      setDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save staff');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (staffMember: TenantUser) => {
    setConfirmState({ open: true, staff: staffMember });
  };

  const confirmDelete = async () => {
    const staffMember = confirmState.staff;
    if (!staffMember) return;
    setConfirmState({ open: false, staff: null });
    try {
      // Remove from tenants/{tenantId}/users + user_tenant_index
      await TenantService.removeStaffUser(tenantId, staffMember.id!, staffMember.email || '');
      toast.success('Staff deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete staff');
    }
  };

  const getRoleStyle = (role: string) => {
    switch (role) {
      case 'admin':   return { bg: 'rgba(139,92,246,0.1)',  color: '#7c3aed', border: 'rgba(139,92,246,0.3)' };
      case 'waiter':  return { bg: 'rgba(59,130,246,0.1)',  color: '#2563eb', border: 'rgba(59,130,246,0.3)' };
      case 'kitchen': return { bg: 'rgba(245,158,11,0.1)',  color: '#d97706', border: 'rgba(245,158,11,0.3)' };
      default:        return { bg: 'rgba(107,114,128,0.1)', color: '#4b5563', border: 'rgba(107,114,128,0.3)' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-amber-500 border-r-transparent"></div>
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

      {/* ── Stats Cards ── */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatsCard
          title="Total Staff"
          value={staff.length}
          accentColor="blue"
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <StatsCard
          title="Active Staff"
          value={staff.filter((s) => s.isActive).length}
          accentColor="green"
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatsCard
          title="Waiters"
          value={staff.filter((s) => s.role === 'waiter').length}
          accentColor="blue"
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
        />
        <StatsCard
          title="Kitchen Staff"
          value={staff.filter((s) => s.role === 'kitchen').length}
          accentColor="amber"
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          }
        />
      </div>

      {/* ── Staff Grid ── */}
      {staff.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {staff.map((staffMember) => {
            const roleStyle = getRoleStyle(staffMember.role);
            return (
              <Card key={staffMember.id} className="overflow-hidden hover:-translate-y-0.5 transition-transform duration-200">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{staffMember.name}</CardTitle>
                      <p className="text-sm text-gray-500 mt-0.5">{staffMember.phone}</p>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <span style={{ padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: roleStyle.bg, color: roleStyle.color, border: `1px solid ${roleStyle.border}` }}>
                        {staffMember.role}
                      </span>
                      <span style={{ padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: staffMember.isActive ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: staffMember.isActive ? '#16a34a' : '#dc2626', border: `1px solid ${staffMember.isActive ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
                        {staffMember.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div className="text-sm">
                    <p className="text-gray-500">Email</p>
                    <p className="font-medium text-gray-800">{staffMember.email}</p>
                  </div>

                  <div className="text-sm">
                    <p className="text-gray-500">Joined</p>
                    <p className="font-medium text-gray-800">
                      {staffMember.registeredAt ? formatDate(staffMember.registeredAt, 'MMM dd, yyyy') : '—'}
                    </p>
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
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-900">No staff members yet</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding a waiter or kitchen staff.</p>
          <div className="mt-6">
            <Button onClick={handleAdd}>Add Staff</Button>
          </div>
        </div>
      )}

      {/* ── Confirm Delete Dialog ── */}
      <ConfirmDialog
        open={confirmState.open}
        title={`Delete ${confirmState.staff?.name}?`}
        message={`This will permanently remove ${confirmState.staff?.name} from your staff list. They will no longer be able to log in.`}
        confirmLabel="Yes, Delete"
        cancelLabel="Keep Staff"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmState({ open: false, staff: null })}
      />

      {/* ── Add / Edit Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingStaff ? 'Edit Staff Member' : 'Add New Staff'}</DialogTitle>
          </DialogHeader>

          {!editingStaff && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200 mb-1">
              <span className="text-lg">🔑</span>
              <div>
                <p className="text-xs font-bold text-amber-800">Staff Login Credentials</p>
                <p className="text-xs text-amber-700 mt-0.5">Set email & password here. Staff will use these to login at the dashboard.</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g. Ravi Kumar"
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
                    <SelectItem value="waiter">🧍 Waiter</SelectItem>
                    <SelectItem value="kitchen">🍳 Kitchen</SelectItem>
                    <SelectItem value="admin">👑 Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  placeholder="9999888899"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>

            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Login Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="staff@yourrestaurant.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={!!editingStaff}
              />
              {editingStaff && <p className="text-xs text-gray-400">Email cannot be changed after creation.</p>}
            </div>

            {/* Password — only for new staff */}
            {!editingStaff && (
              <div className="space-y-2">
                <Label htmlFor="password">Login Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Min. 6 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                />
                <p className="text-xs text-gray-500">
                  Share this password with the staff member. They use it to login at <strong>/login</strong>.
                </p>
              </div>
            )}

            {editingStaff && (
              <div className="flex items-center justify-between py-1 px-3 rounded-lg bg-gray-50 border border-gray-200">
                <Label htmlFor="isActive" className="cursor-pointer">Mark as Active</Label>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : editingStaff ? 'Update Staff' : 'Create Staff Account'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
