'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { TenantService } from '@/lib/tenant';
import { TenantUser, UserRole } from '@/types';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export default function SettingsPage() {
  const { user, isAdmin, refreshUser, createStaff } = useAuth();
  const router = useRouter();

  const [profileForm, setProfileForm] = useState({
    restaurantName: '',
    phone: '',
    address: '',
    gstin: '',
    email: '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  const [staffList, setStaffList] = useState<TenantUser[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);

  const [newStaff, setNewStaff] = useState({ name: '', email: '', password: '', role: 'waiter' as UserRole, phone: '' });
  const [addingStaff, setAddingStaff] = useState(false);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [staffError, setStaffError] = useState('');
  const [deactivateConfirm, setDeactivateConfirm] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: '', name: '' });

  useEffect(() => {
    if (!isAdmin) { router.push('/dashboard'); return; }
    loadProfile();
    loadStaff();
  }, [isAdmin]);

  const loadProfile = async () => {
    if (!user) return;
    setProfileLoading(true);
    try {
      const tenant = await TenantService.getTenant(user.tenantId);
      if (tenant) {
        setProfileForm({
          restaurantName: tenant.restaurantName || '',
          phone: tenant.phone || '',
          address: tenant.address || '',
          gstin: tenant.gstin || '',
          email: tenant.email || '',
        });
      }
    } finally { setProfileLoading(false); }
  };

  const loadStaff = async () => {
    if (!user) return;
    setStaffLoading(true);
    try {
      const users = await TenantService.getTenantUsers(user.tenantId);
      setStaffList(users);
    } finally { setStaffLoading(false); }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setProfileSaving(true);
    try {
      await TenantService.updateTenant(user.tenantId, profileForm);
      await refreshUser();
      toast.success('Restaurant profile saved!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save settings');
    } finally { setProfileSaving(false); }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffError('');
    if (!newStaff.name || !newStaff.email || !newStaff.password) {
      setStaffError('Please fill in all required fields');
      return;
    }
    if (newStaff.password.length < 6) {
      setStaffError('Password must be at least 6 characters');
      return;
    }
    setAddingStaff(true);
    try {
      await createStaff({ name: newStaff.name, email: newStaff.email, password: newStaff.password, role: newStaff.role, phone: newStaff.phone });
      toast.success(`${newStaff.name} added as ${newStaff.role}!`);
      setNewStaff({ name: '', email: '', password: '', role: 'waiter', phone: '' });
      setShowAddStaff(false);
      loadStaff();
    } catch (err: any) {
      setStaffError(err.message || 'Failed to add staff');
    } finally { setAddingStaff(false); }
  };

  const handleDeactivateStaff = async (staffId: string, staffName: string) => {
    setDeactivateConfirm({ open: true, id: staffId, name: staffName });
  };

  const confirmDeactivate = async () => {
    if (!user) return;
    const { id, name } = deactivateConfirm;
    setDeactivateConfirm({ open: false, id: '', name: '' });
    try {
      await TenantService.updateStaffUser(user.tenantId, id, { isActive: false });
      toast.success(`${name} has been deactivated.`);
      loadStaff();
    } catch {
      toast.error('Failed to deactivate staff');
    }
  };

  const ROLE_COLORS: Record<UserRole, string> = {
    admin: 'bg-amber-100 text-amber-700',
    waiter: 'bg-blue-100 text-blue-700',
    kitchen: 'bg-orange-100 text-orange-700',
  };

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <ConfirmDialog
        open={deactivateConfirm.open}
        title={`Deactivate ${deactivateConfirm.name}?`}
        message={`${deactivateConfirm.name} will no longer be able to log in. You can reactivate them from the Staff Management page.`}
        confirmLabel="Yes, Deactivate"
        cancelLabel="Keep Active"
        variant="warning"
        onConfirm={confirmDeactivate}
        onCancel={() => setDeactivateConfirm({ open: false, id: '', name: '' })}
      />
      <div>
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your restaurant profile and team</p>
      </div>

      {/* Restaurant Profile */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-bold text-gray-900 mb-4">🏪 Restaurant Profile</h2>
        {profileLoading ? (
          <div className="flex items-center gap-2 text-gray-400 text-sm py-4"><div className="animate-spin h-4 w-4 border-2 border-amber-400 border-t-transparent rounded-full" />Loading...</div>
        ) : (
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Restaurant Name *</label>
                <input value={profileForm.restaurantName} onChange={(e) => setProfileForm({ ...profileForm, restaurantName: e.target.value })} placeholder="Your restaurant name" required className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Phone Number</label>
                <input value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} placeholder="9876543210" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Email Address</label>
                <input type="email" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} placeholder="restaurant@example.com" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">GSTIN</label>
                <input value={profileForm.gstin} onChange={(e) => setProfileForm({ ...profileForm, gstin: e.target.value })} placeholder="29ABCDE1234F1Z5" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 transition-colors" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Address</label>
                <input value={profileForm.address} onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })} placeholder="Full restaurant address" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 transition-colors" />
              </div>
            </div>
            <button type="submit" disabled={profileSaving} className="px-5 py-2 bg-gray-900 text-white text-sm font-bold rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50">
              {profileSaving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        )}
      </div>

      {/* GST Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-bold text-gray-900 mb-3">📊 Tax Configuration</h2>
        <div className="space-y-2">
          <div className="flex justify-between py-2 border-b border-gray-100 text-sm"><span className="text-gray-600">CGST Rate</span><span className="font-semibold text-gray-900">Variable (5%, 12%, 18%)</span></div>
          <div className="flex justify-between py-2 text-sm"><span className="text-gray-600">SGST Rate</span><span className="font-semibold text-gray-900">Variable (5%, 12%, 18%)</span></div>
          <p className="text-xs text-gray-400 mt-2">GST rates are configured per menu item in the Menu section.</p>
        </div>
      </div>

      {/* Staff Management */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-gray-900">👥 Team Members</h2>
            <p className="text-xs text-gray-400 mt-0.5">Add waiters and kitchen staff</p>
          </div>
          <button onClick={() => setShowAddStaff(!showAddStaff)} className="px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-gray-800 transition-colors">
            {showAddStaff ? '✕ Cancel' : '+ Add Staff'}
          </button>
        </div>

        {showAddStaff && (
          <form onSubmit={handleAddStaff} className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200">
            <h3 className="text-xs font-bold text-gray-700 mb-3">Add New Staff Member</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
                <input value={newStaff.name} onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })} placeholder="Full name" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 bg-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
                <input type="email" value={newStaff.email} onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })} placeholder="staff@email.com" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 bg-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Password *</label>
                <input type="password" value={newStaff.password} onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })} placeholder="Min 6 characters" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 bg-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Role *</label>
                <select value={newStaff.role} onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value as UserRole })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 bg-white">
                  <option value="waiter">Waiter</option>
                  <option value="kitchen">Kitchen</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Phone (optional)</label>
                <input value={newStaff.phone} onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })} placeholder="9876543210" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 bg-white" />
              </div>
            </div>
            {staffError && <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-3 mb-3">⚠️ {staffError}</div>}
            <button type="submit" disabled={addingStaff} className="px-5 py-2 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors">
              {addingStaff ? 'Creating account...' : 'Create Staff Account'}
            </button>
          </form>
        )}

        {staffLoading ? (
          <div className="text-sm text-gray-400 py-4 text-center">Loading team...</div>
        ) : staffList.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No staff members yet. Add your first team member above.</p>
        ) : (
          <div className="space-y-2">
            {staffList.map((staff) => (
              <div key={staff.id} className={`flex items-center justify-between p-3 rounded-lg border ${staff.isActive ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-sm font-bold text-amber-700">
                    {staff.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{staff.name}</p>
                    <p className="text-xs text-gray-400">{staff.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${ROLE_COLORS[staff.role]}`}>{staff.role}</span>
                  {!staff.isActive && <span className="text-xs text-red-500 font-medium">Inactive</span>}
                  {staff.isActive && staff.role !== 'admin' && (
                    <button onClick={() => handleDeactivateStaff(staff.id!, staff.name)} className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors">Deactivate</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Subscription Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-bold text-gray-900 mb-3">💳 Subscription</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-700 font-medium capitalize">
              Status: <span className={`font-bold ${user?.subscriptionStatus === 'active' ? 'text-green-600' : user?.subscriptionStatus === 'trial' ? 'text-blue-600' : 'text-red-600'}`}>{user?.subscriptionStatus}</span>
            </p>
            {user?.subscriptionStatus === 'trial' && (
              <p className="text-xs text-gray-400 mt-1">{user.trialDaysRemaining} days remaining in free trial</p>
            )}
          </div>
          {user?.subscriptionStatus !== 'active' && (
            <a href="/subscribe" className="px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-gray-800 transition-colors">Upgrade →</a>
          )}
        </div>
      </div>
    </div>
  );
}
