import { Timestamp } from 'firebase/firestore';

// User Roles
export type UserRole = 'admin' | 'waiter' | 'kitchen';

// Order Status
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';

// Payment Status
export type PaymentStatus = 'pending' | 'paid' | 'refunded';

// Payment Method
export type PaymentMethod = 'cash' | 'upi' | 'card';

// Order Type
export type OrderType = 'dine-in' | 'takeaway' | 'delivery';

// Table Status
export type TableStatus = 'available' | 'occupied' | 'reserved';

// Restaurant
export interface Restaurant {
  id: string;
  name: string;
  gstin: string;
  address: string;
  phone: string;
  logo: string;
  createdAt: Timestamp;
}

// User
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

// Table
export interface Table {
  id: string;
  tableNumber: number;
  capacity: number;
  status: TableStatus;
  currentOrderId: string | null;
  section?: string;
  restaurantId: string;
}

// Menu Category
export interface MenuCategory {
  id: string;
  name: string;
  order: number;
  isActive: boolean;
  restaurantId: string;
}

// Menu Item
export interface MenuItem {
  id: string;
  name: string;
  category: string; // categoryId reference
  price: number;
  description: string;
  image: string;
  isVeg: boolean;
  isAvailable: boolean;
  preparationTime: number; // in minutes
  gstRate: number; // 5, 12, or 18
  ingredients?: string[]; // for inventory
  restaurantId: string;
}

// Order Item
export interface OrderItem {
  itemId: string;
  itemName: string;
  quantity: number;
  price: number;
  specialInstructions?: string;
  gstRate: number;
}

// Order
export interface Order {
  id: string;
  orderNumber: string; // ORD-YYYYMMDD-XXX
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
  customerId?: string; // Reference to customer document for automatic tracking
  deliveryAddress?: string;
  orderType: OrderType;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt: Timestamp | null;
  createdBy: string;
  restaurantId: string;
}

// Bill
export interface Bill {
  id: string;
  billNumber: string; // INV-YYYYMMDD-XXX
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
  createdBy: string; // userId
  createdByName: string;
  restaurantId?: string;
  customerName?: string;
  customerPhone?: string;
  tableNumber?: number | null;
}

// Customer
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

// Staff
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

// Inventory Item
export interface InventoryItem {
  id: string;
  name: string;
  unit: string; // kg, liter, pieces
  currentStock: number;
  minimumStock: number;
  price: number;
  supplier: string;
  lastPurchaseDate: Timestamp;
  restaurantId: string;
}

// Supplier
export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  items: string[]; // array of itemIds
  totalPurchased: number;
  restaurantId: string;
}

// Auth State
export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

// Dashboard Stats
export interface DashboardStats {
  todayRevenue: number;
  todayOrders: number;
  activeTables: number;
  popularItems: { itemName: string; count: number }[];
  recentOrders: Order[];
  revenueChart: { date: string; revenue: number }[];
}

// Discount Type
export type DiscountType = 'percentage' | 'flat';

// Discount
export interface Discount {
  type: DiscountType;
  value: number;
}

// Restaurant Settings
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
  loyaltyPointsRatio: number; // points per rupee
  enableOnlineOrdering: boolean;
  taxRates: {
    cgst: number;
    sgst: number;
  };
}
