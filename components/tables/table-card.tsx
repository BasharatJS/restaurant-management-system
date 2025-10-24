'use client';

import { Table } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TableCardProps {
  table: Table;
  onClick?: (table: Table) => void;
}

export function TableCard({ table, onClick }: TableCardProps) {
  const getStatusColor = () => {
    switch (table.status) {
      case 'available':
        return 'bg-green-50 border-green-200 hover:bg-green-100';
      case 'occupied':
        return 'bg-red-50 border-red-200 hover:bg-red-100';
      case 'reserved':
        return 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100';
      default:
        return 'bg-gray-50 border-gray-200 hover:bg-gray-100';
    }
  };

  const getStatusBadgeColor = () => {
    switch (table.status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'occupied':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'reserved':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-lg',
        getStatusColor()
      )}
      onClick={() => onClick?.(table)}
    >
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg
                className="h-8 w-8 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <h3 className="text-2xl font-bold text-gray-900">Table {table.tableNumber}</h3>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <p>Capacity: {table.capacity} seats</p>
              {table.section && <p className="mt-1">Section: {table.section}</p>}
            </div>
            <Badge className={getStatusBadgeColor()} variant="outline">
              {table.status}
            </Badge>
          </div>

          {table.status === 'occupied' && table.currentOrderId && (
            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-500">Order ID: {table.currentOrderId.slice(0, 8)}...</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
