import { Timestamp } from 'firebase/firestore';

// ─── User Roles ───────────────────────────────────────────────────────────────
export type UserRole = 'admin' | 'waiter' | 'kitchen';

// ─── Order Status ─────────────────────────────────────────────────────────────
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';

// ─── Payment Status ───────────────────────────────────────────────────────────
export type PaymentStatus = 'pending' | 'paid' | 'refunded';

// ─── Payment Method ───────────────────────────────────────────────────────────
export type PaymentMethod = 'cash' | 'upi' | 'card';

// ─── Order Type ───────────────────────────────────────────────────────────────
export type OrderType = 'dine-in' | 'takeaway' | 'delivery';

// ─── Table Status ─────────────────────────────────────────────────────────────
export type TableStatus = 'available' | 'occupied' | 'reserved';

// ─── Restaurant / Tenant ─────────────────────────────────────────────────────
export interface Restaurant {
  id: string;
  name: string;
  gstin: string;
  address: string;
  phone: string;
  logo: string;
  createdAt: Timestamp;
}

// ─── Existing User (kept for backward compat inside tenant) ──────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  isActive: boolean;
  createdAt: Timestamp;
  restaurantId: string;
}

// ─── Table ────────────────────────────────────────────────────────────────────
export interface Table {
  id: string;
  tableNumber: number;
  capacity: number;
  status: TableStatus;
  currentOrderId: string | null;
  section?: string;
  restaurantId: string;
}

// ─── Menu Category ────────────────────────────────────────────────────────────
export interface MenuCategory {
  id: string;
  name: string;
  order: number;
  isActive: boolean;
  restaurantId: string;
}

// ─── Menu Item ────────────────────────────────────────────────────────────────
export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image: string;
  isVeg: boolean;
  isAvailable: boolean;
  preparationTime: number;
  gstRate: number;
  ingredients?: string[];
  restaurantId: string;
}

// ─── Order Item ───────────────────────────────────────────────────────────────
export interface OrderItem {
  itemId: string;
  itemName: string;
  quantity: number;
  price: number;
  specialInstructions?: string;
  gstRate: number;
}

// ─── Order ────────────────────────────────────────────────────────────────────
export interface Order {
  id: string;
  orderNumber: string;
  tableId: string | null;
  tableNumber: number | null;
  items: OrderItem[];
  subtotal: number;
  cgst: number;
  sgst: number;
  totalAmount: number;
  discount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  waiterId: string;
  waiterName: string;
  customerName?: string;
  customerPhone?: string;
  customerId?: string;
  deliveryAddress?: string;
  orderType: OrderType;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt: Timestamp | null;
  createdBy: string;
  restaurantId: string;
}

// ─── Bill ─────────────────────────────────────────────────────────────────────
export interface Bill {
  id: string;
  billNumber: string;
  orderId: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  cgst: number;
  sgst: number;
  discount: number;
  totalAmount: number;
  paidAmount?: number;
  paymentMethod: PaymentMethod;
  orderType: OrderType;
  createdAt: Timestamp;
  createdBy: string;
  createdByName: string;
  restaurantId?: string;
  customerName?: string;
  customerPhone?: string;
  tableNumber?: number | null;
}

// ─── Customer ─────────────────────────────────────────────────────────────────
export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  totalOrders: number;
  totalSpent: number;
  lastVisit: Timestamp;
  loyaltyPoints: number;
  restaurantId: string;
}

// ─── Staff ────────────────────────────────────────────────────────────────────
export interface Staff {
  id: string;
  name: string;
  role: UserRole;
  phone: string;
  email: string;
  joiningDate: Timestamp;
  isActive: boolean;
  salary?: number;
  shifts?: string[];
  restaurantId: string;
}

// ─── Inventory Item ───────────────────────────────────────────────────────────
export interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  price: number;
  supplier: string;
  lastPurchaseDate: Timestamp;
  restaurantId: string;
}

// ─── Supplier ─────────────────────────────────────────────────────────────────
export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  items: string[];
  totalPurchased: number;
  restaurantId: string;
}

// ─── Auth State (legacy) ──────────────────────────────────────────────────────
export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
export interface DashboardStats {
  todayRevenue: number;
  todayOrders: number;
  activeTables: number;
  popularItems: { itemName: string; count: number }[];
  recentOrders: Order[];
  revenueChart: { date: string; revenue: number }[];
}

// ─── Discount ─────────────────────────────────────────────────────────────────
export type DiscountType = 'percentage' | 'flat';

export interface Discount {
  type: DiscountType;
  value: number;
}

// ─── Restaurant Settings ──────────────────────────────────────────────────────
export interface RestaurantSettings {
  restaurantId: string;
  name: string;
  gstin: string;
  address: string;
  phone: string;
  email: string;
  logo: string;
  currency: string;
  timezone: string;
  enableLoyaltyPoints: boolean;
  loyaltyPointsRatio: number;
  enableOnlineOrdering: boolean;
  taxRates: {
    cgst: number;
    sgst: number;
  };
}

// ─── Expense ──────────────────────────────────────────────────────────────────
export type ExpenseCategory = 'rent' | 'utilities' | 'salaries' | 'supplies' | 'marketing' | 'maintenance' | 'other';

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  description?: string;
  date: Timestamp;
  createdBy: string;
  createdByName: string;
  restaurantId: string;
  createdAt: Timestamp;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SAAS / MULTI-TENANCY MODELS
// ═══════════════════════════════════════════════════════════════════════════════

export type SubscriptionPlan = 'monthly' | 'annual';
export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'cancelled';

export interface Tenant {
  id?: string;
  restaurantName: string;
  ownerName: string;
  ownerEmail: string;
  ownerUid: string;
  phone?: string;
  address?: string;
  gstin?: string;
  email?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Subscription {
  id?: string;
  tenantId: string;
  plan: SubscriptionPlan | null;
  status: SubscriptionStatus;
  trialStartDate: Timestamp;
  trialEndDate: Timestamp;
  subscriptionStartDate?: Timestamp;
  subscriptionEndDate?: Timestamp;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  amount?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface TenantUser {
  id?: string;
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  tenantId: string;
  phone?: string;
  invitedAt?: Timestamp;
  registeredAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Auth Context User (enriched) ─────────────────────────────────────────────
export interface AuthUser {
  uid: string;
  email: string;
  name: string;
  restaurantName: string;
  restaurantPhone: string;
  restaurantAddress: string;
  restaurantGstin?: string;
  restaurantEmail?: string;
  role: UserRole;
  isActive: boolean;
  tenantId: string;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: Date | null;
  trialDaysRemaining: number;
}

// ─── Super Admin Types ────────────────────────────────────────────────────────
export interface TenantWithSubscription {
  tenant: Tenant;
  subscription: Subscription | null;
  userCount: number;
}
