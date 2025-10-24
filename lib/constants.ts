// GST Rates
export const GST_RATES = [5, 12, 18] as const;

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  WAITER: 'waiter',
  KITCHEN: 'kitchen',
} as const;

// Order Status
export const ORDER_STATUS = {
  PENDING: 'pending',
  PREPARING: 'preparing',
  READY: 'ready',
  SERVED: 'served',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
} as const;

// Payment Methods
export const PAYMENT_METHODS = {
  CASH: 'cash',
  UPI: 'upi',
  CARD: 'card',
} as const;

// Order Types
export const ORDER_TYPES = {
  DINE_IN: 'dine-in',
  TAKEAWAY: 'takeaway',
  DELIVERY: 'delivery',
} as const;

// Table Status
export const TABLE_STATUS = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  RESERVED: 'reserved',
} as const;

// Restaurant ID
export const RESTAURANT_ID = process.env.NEXT_PUBLIC_RESTAURANT_ID || 'default_restaurant';

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  DISPLAY_WITH_TIME: 'MMM dd, yyyy hh:mm a',
  FILE_NAME: 'yyyyMMdd',
  BILL_NUMBER: 'yyyyMMdd',
} as const;

// Pagination
export const ITEMS_PER_PAGE = 20;

// Image Upload
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

// Currency
export const CURRENCY_SYMBOL = '₹';
export const CURRENCY_CODE = 'INR';

// Loyalty Points
export const DEFAULT_LOYALTY_POINTS_RATIO = 10; // 10 rupees = 1 point
