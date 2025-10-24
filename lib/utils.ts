import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { CURRENCY_SYMBOL } from './constants';
import { OrderItem } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number): string {
  return `${CURRENCY_SYMBOL}${amount.toFixed(2)}`;
}

/**
 * Format date from Firestore Timestamp
 */
export function formatDate(timestamp: Timestamp | Date, formatStr: string = 'MMM dd, yyyy'): string {
  const date = timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;
  return format(date, formatStr);
}

/**
 * Calculate GST amount
 */
export function calculateGST(amount: number, gstRate: number): { cgst: number; sgst: number; total: number } {
  const gstAmount = (amount * gstRate) / 100;
  const cgst = gstAmount / 2;
  const sgst = gstAmount / 2;
  return {
    cgst: Number(cgst.toFixed(2)),
    sgst: Number(sgst.toFixed(2)),
    total: Number(gstAmount.toFixed(2)),
  };
}

/**
 * Calculate order totals
 */
export function calculateOrderTotals(items: OrderItem[], discount: number = 0): {
  subtotal: number;
  cgst: number;
  sgst: number;
  totalGST: number;
  totalAmount: number;
} {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Calculate GST for each item based on its GST rate
  let totalCGST = 0;
  let totalSGST = 0;

  items.forEach(item => {
    const itemTotal = item.price * item.quantity;
    const gst = calculateGST(itemTotal, item.gstRate);
    totalCGST += gst.cgst;
    totalSGST += gst.sgst;
  });

  const totalGST = totalCGST + totalSGST;
  const totalAmount = subtotal + totalGST - discount;

  return {
    subtotal: Number(subtotal.toFixed(2)),
    cgst: Number(totalCGST.toFixed(2)),
    sgst: Number(totalSGST.toFixed(2)),
    totalGST: Number(totalGST.toFixed(2)),
    totalAmount: Number(totalAmount.toFixed(2)),
  };
}

/**
 * Generate order number
 */
export function generateOrderNumber(): string {
  const date = format(new Date(), 'yyyyMMdd');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${date}-${random}`;
}

/**
 * Generate bill number
 */
export function generateBillNumber(): string {
  const date = format(new Date(), 'yyyyMMdd');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `INV-${date}-${random}`;
}

/**
 * Round off amount (to nearest rupee)
 */
export function roundOff(amount: number): number {
  return Math.round(amount);
}

/**
 * Get time ago string
 */
export function getTimeAgo(timestamp: Timestamp | Date): string {
  const date = timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMins = Math.floor(diffInMs / 60000);

  if (diffInMins < 1) return 'Just now';
  if (diffInMins < 60) return `${diffInMins} min${diffInMins > 1 ? 's' : ''} ago`;

  const diffInHours = Math.floor(diffInMins / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
}

/**
 * Validate email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (Indian format)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
}

/**
 * Format phone number
 */
export function formatPhone(phone: string): string {
  if (phone.length === 10) {
    return `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`;
  }
  return phone;
}

/**
 * Truncate text
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Get status color
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    preparing: 'bg-blue-100 text-blue-800 border-blue-200',
    ready: 'bg-green-100 text-green-800 border-green-200',
    served: 'bg-purple-100 text-purple-800 border-purple-200',
    completed: 'bg-gray-100 text-gray-800 border-gray-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
    available: 'bg-green-100 text-green-800 border-green-200',
    occupied: 'bg-red-100 text-red-800 border-red-200',
    reserved: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    paid: 'bg-green-100 text-green-800 border-green-200',
  };
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
}

/**
 * Download as file
 */
export function downloadFile(content: string, filename: string, type: string = 'text/plain') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Calculate percentage
 */
export function calculatePercentage(part: number, total: number): number {
  if (total === 0) return 0;
  return Number(((part / total) * 100).toFixed(2));
}
