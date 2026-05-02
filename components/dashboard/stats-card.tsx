'use client';

import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
  accentColor?: 'amber' | 'green' | 'blue' | 'purple' | 'red' | 'orange';
  className?: string;
}

const accentMap = {
  amber:  { bg: 'rgba(245,158,11,0.1)',  icon: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.25)',  text: '#d97706', bar: '#f59e0b' },
  green:  { bg: 'rgba(34,197,94,0.06)',  icon: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.2)',    text: '#16a34a', bar: '#22c55e' },
  blue:   { bg: 'rgba(59,130,246,0.06)', icon: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.2)',   text: '#2563eb', bar: '#3b82f6' },
  purple: { bg: 'rgba(139,92,246,0.06)', icon: 'rgba(139,92,246,0.12)',  border: 'rgba(139,92,246,0.2)',   text: '#7c3aed', bar: '#8b5cf6' },
  red:    { bg: 'rgba(239,68,68,0.06)',  icon: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.2)',    text: '#dc2626', bar: '#ef4444' },
  orange: { bg: 'rgba(249,115,22,0.06)', icon: 'rgba(249,115,22,0.12)',  border: 'rgba(249,115,22,0.2)',   text: '#ea580c', bar: '#f97316' },
};

export function StatsCard({ title, value, icon, trend, subtitle, accentColor = 'amber', className }: StatsCardProps) {
  const accent = accentMap[accentColor];

  return (
    <div
      className={cn('rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md', className)}
      style={{
        background: '#fff',
        border: `1px solid ${accent.border}`,
        borderLeft: `4px solid ${accent.bar}`,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: label + value + trend */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#9ca3af' }}>{title}</p>
          <p className="mt-2 text-[28px] font-black leading-none" style={{ color: '#0f172a' }}>{value}</p>

          {subtitle && (
            <p className="mt-1.5 text-xs" style={{ color: '#6b7280' }}>{subtitle}</p>
          )}

          {trend && (
            <div className="mt-2 flex items-center gap-1.5">
              <span className="text-xs font-bold" style={{ color: trend.isPositive ? '#16a34a' : '#dc2626' }}>
                {trend.isPositive ? '↑' : '↓'} {trend.value}%
              </span>
              <span className="text-xs" style={{ color: '#9ca3af' }}>vs last week</span>
            </div>
          )}
        </div>

        {/* Right: icon circle */}
        <div
          className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: accent.icon }}
        >
          <div style={{ color: accent.text }}>{icon}</div>
        </div>
      </div>

      {/* Bottom accent bar */}
      <div className="mt-4 h-0.5 rounded-full" style={{ background: `linear-gradient(90deg, ${accent.bar}33, transparent)` }} />
    </div>
  );
}
