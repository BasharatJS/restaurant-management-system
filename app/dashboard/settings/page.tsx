'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    restaurantName: 'My Restaurant',
    gstin: '29ABCDE1234F1Z5',
    address: '123 Main Street, City',
    phone: '9876543210',
    email: 'restaurant@example.com',
  });

  useEffect(() => {
    if (user?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
  }, [user, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Settings updated successfully!');
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Restaurant Settings</h1>
        <p className="text-sm text-gray-600">Manage your restaurant configuration</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Restaurant Information</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Restaurant Name *</Label>
              <Input value={formData.restaurantName} onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>GSTIN *</Label>
              <Input value={formData.gstin} onChange={(e) => setFormData({ ...formData, gstin: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Address *</Label>
              <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone *</Label>
                <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
              </div>
            </div>
            <Button type="submit" className="w-full">Save Settings</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Tax Configuration</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between py-2 border-b"><span>CGST Rate</span><span className="font-semibold">Variable (5%, 12%, 18%)</span></div>
            <div className="flex justify-between py-2 border-b"><span>SGST Rate</span><span className="font-semibold">Variable (5%, 12%, 18%)</span></div>
            <p className="text-sm text-gray-500 mt-4">GST rates are configured per menu item</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Loyalty Program</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between py-2"><span>Points Ratio</span><span className="font-semibold">₹10 = 1 Point</span></div>
            <div className="flex justify-between py-2"><span>Status</span><span className="font-semibold text-green-600">Enabled</span></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
