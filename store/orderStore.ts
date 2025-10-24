import { create } from 'zustand';
import { OrderItem, MenuItem } from '@/types';

interface OrderStore {
  items: OrderItem[];
  tableId: string | null;
  tableNumber: number | null;
  customerName: string;
  customerPhone: string;
  orderType: 'dine-in' | 'takeaway' | 'delivery';

  addItem: (menuItem: MenuItem, quantity: number, specialInstructions?: string) => void;
  removeItem: (itemId: string) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  updateSpecialInstructions: (itemId: string, instructions: string) => void;
  setTable: (tableId: string | null, tableNumber: number | null) => void;
  setCustomer: (name: string, phone: string) => void;
  setOrderType: (orderType: 'dine-in' | 'takeaway' | 'delivery') => void;
  clearOrder: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useOrderStore = create<OrderStore>((set, get) => ({
  items: [],
  tableId: null,
  tableNumber: null,
  customerName: '',
  customerPhone: '',
  orderType: 'dine-in',

  addItem: (menuItem, quantity, specialInstructions) => {
    const items = get().items;
    const existingItemIndex = items.findIndex(
      item => item.itemId === menuItem.id && item.specialInstructions === specialInstructions
    );

    if (existingItemIndex !== -1) {
      // Update quantity if item exists with same instructions
      const updatedItems = [...items];
      updatedItems[existingItemIndex].quantity += quantity;
      set({ items: updatedItems });
    } else {
      // Add new item
      const newItem: OrderItem = {
        itemId: menuItem.id,
        itemName: menuItem.name,
        quantity,
        price: menuItem.price,
        specialInstructions,
        gstRate: menuItem.gstRate,
      };
      set({ items: [...items, newItem] });
    }
  },

  removeItem: (itemId) => {
    set({ items: get().items.filter(item => item.itemId !== itemId) });
  },

  updateItemQuantity: (itemId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(itemId);
      return;
    }

    const updatedItems = get().items.map(item =>
      item.itemId === itemId ? { ...item, quantity } : item
    );
    set({ items: updatedItems });
  },

  updateSpecialInstructions: (itemId, instructions) => {
    const updatedItems = get().items.map(item =>
      item.itemId === itemId ? { ...item, specialInstructions: instructions } : item
    );
    set({ items: updatedItems });
  },

  setTable: (tableId, tableNumber) => {
    set({ tableId, tableNumber });
  },

  setCustomer: (name, phone) => {
    set({ customerName: name, customerPhone: phone });
  },

  setOrderType: (orderType) => {
    set({ orderType });
  },

  clearOrder: () => {
    set({
      items: [],
      tableId: null,
      tableNumber: null,
      customerName: '',
      customerPhone: '',
      orderType: 'dine-in',
    });
  },

  getTotal: () => {
    return get().items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  },

  getItemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },
}));
