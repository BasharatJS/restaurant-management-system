'use client';

import { MenuItem } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';

interface MenuItemCardProps {
  item: MenuItem;
  onEdit?: (item: MenuItem) => void;
  onDelete?: (item: MenuItem) => void;
  onToggleAvailability?: (item: MenuItem) => void;
}

export function MenuItemCard({ item, onEdit, onDelete, onToggleAvailability }: MenuItemCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-48 bg-gray-200">
        {item.image ? (
          <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <svg
              className="h-16 w-16 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
        <div className="absolute top-2 right-2 flex gap-2">
          <Badge className={item.isVeg ? 'bg-green-600' : 'bg-red-600'}>
            {item.isVeg ? 'VEG' : 'NON-VEG'}
          </Badge>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-lg text-gray-900">{item.name}</h3>
            <p className="text-sm text-gray-600 line-clamp-2 mt-1">{item.description}</p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(item.price)}</p>
              <p className="text-xs text-gray-500">GST: {item.gstRate}%</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Prep Time</p>
              <p className="text-sm font-medium">{item.preparationTime} mins</p>
            </div>
          </div>

          {onToggleAvailability && (
            <div className="flex items-center justify-between py-2 border-t">
              <span className="text-sm font-medium">Available</span>
              <Switch
                checked={item.isAvailable}
                onCheckedChange={() => onToggleAvailability(item)}
              />
            </div>
          )}

          {(onEdit || onDelete) && (
            <div className="flex gap-2 pt-2">
              {onEdit && (
                <Button variant="outline" size="sm" onClick={() => onEdit(item)} className="flex-1">
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(item)}
                  className="flex-1 text-red-600 hover:text-red-700"
                >
                  Delete
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
