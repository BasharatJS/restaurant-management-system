'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Expense, ExpenseCategory } from '@/types';
import { subscribeToCollection, addDocument, updateDocument, deleteDocument } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Timestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { orderBy } from 'firebase/firestore';

const categoryColors: Record<ExpenseCategory, string> = {
  rent: 'bg-blue-100 text-blue-800 border-blue-200',
  utilities: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  salaries: 'bg-green-100 text-green-800 border-green-200',
  supplies: 'bg-purple-100 text-purple-800 border-purple-200',
  marketing: 'bg-pink-100 text-pink-800 border-pink-200',
  maintenance: 'bg-orange-100 text-orange-800 border-orange-200',
  other: 'bg-gray-100 text-gray-800 border-gray-200',
};

export default function ExpensesPage() {
  const { user } = useAuth();
  const tenantId = user?.tenantId || '';
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'other' as ExpenseCategory,
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (user?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    try {
      const unsubscribe = subscribeToCollection<Expense>(
      tenantId,
      'expenses',
        (data) => {
          setExpenses(data);
          setLoading(false);
        },
        [orderBy('date', 'desc')]
      );

      // Set timeout to stop loading if subscription fails
      const timeout = setTimeout(() => {
        setLoading(false);
      }, 5000);

      return () => {
        unsubscribe();
        clearTimeout(timeout);
      };
    } catch (error) {
      console.error('Error subscribing to expenses:', error);
      setLoading(false);
      toast.error('Failed to load expenses. Please check Firestore permissions.');
    }
  }, [user, router]);

  const handleAdd = () => {
    setEditingExpense(null);
    setFormData({
      title: '',
      amount: '',
      category: 'other',
      description: '',
      date: new Date().toISOString().split('T')[0],
    });
    setDialogOpen(true);
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      title: expense.title,
      amount: expense.amount.toString(),
      category: expense.category,
      description: expense.description || '',
      date: expense.date instanceof Timestamp
        ? expense.date.toDate().toISOString().split('T')[0]
        : new Date(expense.date).toISOString().split('T')[0],
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const data: any = {
        title: formData.title,
        amount: parseFloat(formData.amount),
        category: formData.category,
        date: Timestamp.fromDate(new Date(formData.date)),
        createdBy: user?.uid || '',
        createdByName: user?.name || '',
      };

      if (formData.description) {
        data.description = formData.description;
      }

      if (editingExpense) {
        await updateDocument(tenantId, 'expenses', editingExpense.id, data);
        toast.success('Expense updated successfully');
      } else {
        data.createdAt = Timestamp.now();
        await addDocument(tenantId, 'expenses', data);
        toast.success('Expense added successfully');
      }

      setDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save expense');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
      await deleteDocument(tenantId, 'expenses', id);
      toast.success('Expense deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete expense');
    }
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-600">Loading expenses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Expense Management</h1>
          <p className="mt-1 text-sm text-gray-600">Track and manage restaurant expenses</p>
        </div>
        <Button onClick={handleAdd}>+ Add Expense</Button>
      </div>

      {/* Summary Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Expenses</p>
              <p className="mt-2 text-3xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
            </div>
            <div className="rounded-full bg-red-100 p-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expenses List */}
      <Card>
        <CardHeader>
          <CardTitle>All Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.length > 0 ? (
            <div className="space-y-4">
              {expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-gray-900">{expense.title}</h3>
                      <Badge className={categoryColors[expense.category]} variant="outline">
                        {expense.category}
                      </Badge>
                    </div>
                    {expense.description && (
                      <p className="mt-1 text-sm text-gray-600">{expense.description}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      {formatDate(expense.date, 'MMM dd, yyyy')} • Added by {expense.createdByName}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-lg font-bold text-red-600">{formatCurrency(expense.amount)}</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(expense)}>
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(expense.id)} className="text-red-600 hover:text-red-700">
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-gray-500 py-8">No expenses recorded yet</p>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Monthly Rent"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={formData.category} onValueChange={(value: ExpenseCategory) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rent">Rent</SelectItem>
                  <SelectItem value="utilities">Utilities</SelectItem>
                  <SelectItem value="salaries">Salaries</SelectItem>
                  <SelectItem value="supplies">Supplies</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional notes..."
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                {editingExpense ? 'Update' : 'Add'} Expense
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
