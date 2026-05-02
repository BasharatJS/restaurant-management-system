'use client';

import { useEffect, useRef } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

const variantStyles = {
  danger:  { icon: '🗑️', iconBg: 'rgba(239,68,68,0.1)',   iconBorder: 'rgba(239,68,68,0.2)',   btn: 'linear-gradient(135deg,#ef4444,#dc2626)', hoverShadow: 'rgba(239,68,68,0.4)' },
  warning: { icon: '⚠️', iconBg: 'rgba(245,158,11,0.1)',  iconBorder: 'rgba(245,158,11,0.2)',  btn: 'linear-gradient(135deg,#f59e0b,#d97706)', hoverShadow: 'rgba(245,158,11,0.4)' },
  info:    { icon: 'ℹ️', iconBg: 'rgba(59,130,246,0.1)',  iconBorder: 'rgba(59,130,246,0.2)',  btn: 'linear-gradient(135deg,#3b82f6,#2563eb)', hoverShadow: 'rgba(59,130,246,0.4)' },
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const v = variantStyles[variant];

  // Focus cancel button on open for accessibility
  useEffect(() => {
    if (open) setTimeout(() => cancelRef.current?.focus(), 50);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.15s ease',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .confirm-btn-primary:hover { transform: translateY(-1px); }
        .confirm-btn-cancel:hover { background: #f1f5f9 !important; }
      `}</style>

      <div
        style={{
          background: '#fff',
          borderRadius: 20,
          padding: '32px 28px',
          maxWidth: 420,
          width: '100%',
          boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
          animation: 'slideUp 0.2s ease',
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {/* Icon */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: v.iconBg, border: `2px solid ${v.iconBorder}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26,
          }}>
            {v.icon}
          </div>
        </div>

        {/* Title */}
        {title && (
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', textAlign: 'center', marginBottom: 10 }}>
            {title}
          </h3>
        )}

        {/* Message */}
        <p style={{ fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 1.6, marginBottom: 28 }}>
          {message}
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="confirm-btn-cancel"
            style={{
              flex: 1, padding: '12px', borderRadius: 12,
              border: '1.5px solid #e5e7eb', background: '#fff',
              color: '#374151', fontSize: 14, fontWeight: 700,
              cursor: 'pointer', transition: 'all 0.15s',
              fontFamily: 'inherit',
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="confirm-btn-primary"
            style={{
              flex: 1, padding: '12px', borderRadius: 12,
              border: 'none', background: v.btn,
              color: '#fff', fontSize: 14, fontWeight: 800,
              cursor: 'pointer', transition: 'all 0.15s',
              fontFamily: 'inherit',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
