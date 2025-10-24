'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatsCard({ title, value, icon, trend, className }: StatsCardProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <h3 className="mt-2 text-3xl font-bold text-gray-900">{value}</h3>
            {trend && (
              <div className="mt-2 flex items-center gap-1">
                <svg
                  className={cn(
                    'h-4 w-4',
                    trend.isPositive ? 'text-green-600' : 'text-red-600'
                  )}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {trend.isPositive ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                    />
                  )}
                </svg>
                <span
                  className={cn(
                    'text-sm font-medium',
                    trend.isPositive ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {trend.value}%
                </span>
                <span className="text-sm text-gray-500">vs last week</span>
              </div>
            )}
          </div>
          <div className="rounded-full bg-blue-50 p-3">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
