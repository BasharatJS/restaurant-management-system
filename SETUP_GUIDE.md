# Restaurant Management System - Setup Guide

## What Has Been Implemented

### ✅ Core Infrastructure
1. **TypeScript Type Definitions** (`types/index.ts`)
   - Complete type system for all entities
   - User roles, Order status, Payment methods, etc.

2. **Firebase Configuration** (`lib/firebase.ts`)
   - Firebase initialization
   - Auth, Firestore, and Storage setup

3. **Utility Functions** (`lib/utils.ts`, `lib/constants.ts`)
   - Currency formatting
   - Date formatting
   - GST calculations
   - Order number generation
   - Bill number generation
   - Status colors
   - And more...

4. **Firestore Helpers** (`lib/firestore.ts`)
   - CRUD operations
   - Real-time subscriptions
   - Query helpers

5. **State Management**
   - **Auth Context** (`contexts/AuthContext.tsx`) - Role-based authentication
   - **Order Store** (`store/orderStore.ts`) - Zustand store for cart management

### ✅ Authentication System
1. **Login Page** (`app/login/page.tsx`)
   - Beautiful UI with shadcn/ui
   - Email/password authentication
   - Remember me option
   - Error handling
   - Demo credentials display

2. **Auth Context Provider**
   - User authentication state
   - Role-based access control
   - Login/Logout functions
   - Helper functions (isAdmin, isWaiter, isKitchen)

### ✅ Dashboard Layout
1. **Sidebar** (`components/dashboard/sidebar.tsx`)
   - Role-based navigation
   - Active route highlighting
   - Responsive design
   - Icons for all sections

2. **Header** (`components/dashboard/header.tsx`)
   - User profile display
   - Role badge
   - Notifications icon
   - Dropdown menu with logout

3. **Dashboard Layout** (`app/dashboard/layout.tsx`)
   - Protected routes
   - Loading states
   - Sidebar + Header + Content area

### ✅ UI Components (shadcn/ui)
- Button, Input, Select
- Dialog, Card, Badge
- Table, Tabs
- Dropdown Menu, Alert
- Sonner (Toast notifications)
- Label, Textarea, Checkbox, Switch
- Avatar, Separator

---

## Setup Instructions

### 1. Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing one
3. Enable **Authentication** > Email/Password sign-in method
4. Create **Firestore Database** in production mode
5. Enable **Firebase Storage**
6. Get your Firebase config from Project Settings

### 2. Update Environment Variables

Edit `.env.local` file with your Firebase credentials:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_RESTAURANT_ID=default_restaurant
```

### 3. Set Up Firestore Database

Create the following structure in Firestore:

```
restaurants/
  └── default_restaurant/
      ├── users/
      ├── tables/
      ├── menuCategories/
      ├── menuItems/
      ├── orders/
      ├── bills/
      ├── customers/
      ├── staff/
      ├── inventory/
      └── suppliers/
```

### 4. Create Test Users

In Firebase Authentication, create test users:

1. **Admin User**
   - Email: admin@restaurant.com
   - Password: admin123

2. **Waiter User**
   - Email: waiter@restaurant.com
   - Password: waiter123

3. **Kitchen User**
   - Email: kitchen@restaurant.com
   - Password: kitchen123

### 5. Add User Documents in Firestore

For each user created above, add a document in `restaurants/default_restaurant/users/{userId}`:

**Admin User Document:**
```json
{
  "name": "Admin User",
  "email": "admin@restaurant.com",
  "role": "admin",
  "phone": "9876543210",
  "isActive": true,
  "createdAt": [Firestore Timestamp],
  "restaurantId": "default_restaurant"
}
```

**Waiter User Document:**
```json
{
  "name": "Waiter User",
  "email": "waiter@restaurant.com",
  "role": "waiter",
  "phone": "9876543211",
  "isActive": true,
  "createdAt": [Firestore Timestamp],
  "restaurantId": "default_restaurant"
}
```

**Kitchen User Document:**
```json
{
  "name": "Kitchen Staff",
  "email": "kitchen@restaurant.com",
  "role": "kitchen",
  "phone": "9876543212",
  "isActive": true,
  "createdAt": [Firestore Timestamp],
  "restaurantId": "default_restaurant"
}
```

**IMPORTANT:** The document ID in Firestore should match the Firebase Auth UID for each user!

### 6. Run the Application

```bash
npm run dev
```

Visit `http://localhost:3000` - it will redirect to `/login`

### 7. Test Login

Use one of the demo credentials:
- Admin: admin@restaurant.com / admin123
- Waiter: waiter@restaurant.com / waiter123
- Kitchen: kitchen@restaurant.com / kitchen123

---

## Next Steps - Features to Implement

### Phase 1 (Core Features)
- [ ] **Admin Dashboard Page** - Statistics, charts, recent orders
- [ ] **Menu Management** - CRUD operations for menu items and categories
- [ ] **Table Management** - Visual table grid, status management
- [ ] **Order Management** - Create orders, view orders, update status
- [ ] **Billing System** - Generate bills with GST, print invoices
- [ ] **Kitchen Display** - Real-time order queue for kitchen staff

### Phase 2 (Advanced Features)
- [ ] **Customer Management** - Database, loyalty points, order history
- [ ] **Staff Management** - Staff profiles, shifts, performance
- [ ] **Inventory Management** - Stock tracking, low stock alerts, suppliers
- [ ] **Reports & Analytics** - Sales reports, item reports, charts
- [ ] **Settings** - Restaurant settings, profile management
- [ ] **Print Functionality** - KOT and invoice printing

---

## Current Project Structure

```
restaurant-management-system/
├── app/
│   ├── layout.tsx                 # Root layout with AuthProvider
│   ├── page.tsx                   # Redirects to /login
│   ├── login/
│   │   └── page.tsx              # Login page
│   └── dashboard/
│       ├── layout.tsx            # Dashboard layout (protected)
│       └── page.tsx              # Dashboard home (to be created)
├── components/
│   ├── ui/                       # shadcn/ui components
│   └── dashboard/
│       ├── sidebar.tsx           # Sidebar navigation
│       └── header.tsx            # Header with user menu
├── contexts/
│   └── AuthContext.tsx           # Authentication context
├── store/
│   └── orderStore.ts             # Order/cart state (Zustand)
├── lib/
│   ├── firebase.ts               # Firebase configuration
│   ├── firestore.ts              # Firestore helper functions
│   ├── utils.ts                  # Utility functions
│   └── constants.ts              # Constants
├── types/
│   └── index.ts                  # TypeScript type definitions
└── .env.local                    # Environment variables
```

---

## Key Features Implemented

### Authentication & Authorization
- ✅ Context API for auth state
- ✅ Role-based access control (Admin, Waiter, Kitchen)
- ✅ Protected routes
- ✅ Login/Logout functionality
- ✅ User session management

### UI/UX
- ✅ Professional login page
- ✅ Responsive sidebar navigation
- ✅ Header with user profile
- ✅ Role-based menu items
- ✅ Toast notifications (Sonner)
- ✅ Loading states

### State Management
- ✅ Auth Context (user state, login, logout)
- ✅ Order Store (Zustand) - for cart management
- ✅ No custom hooks (as requested)

### Firebase Integration
- ✅ Firebase Auth
- ✅ Firestore database
- ✅ Storage (configured, ready to use)
- ✅ Real-time subscriptions
- ✅ CRUD helper functions

---

## Technology Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Authentication:** Firebase Auth
- **Database:** Firestore
- **Storage:** Firebase Storage
- **State Management:**
  - Context API (Auth)
  - Zustand (Orders/Cart)
- **Notifications:** Sonner
- **Form Validation:** Zod
- **Date Formatting:** date-fns
- **Charts:** Recharts (installed, ready to use)
- **Printing:** react-to-print (installed, ready to use)

---

## Important Notes

1. **No Custom Hooks:** As requested, authentication and data fetching use Context API and direct Firebase calls instead of custom hooks.

2. **Firebase Security Rules:** You need to set up security rules in Firebase Console (see requirements document for the complete ruleset).

3. **Environment Variables:** Never commit `.env.local` to version control. The file is already in `.gitignore`.

4. **User Document IDs:** Make sure user document IDs in Firestore match the Firebase Auth UIDs.

5. **Restaurant ID:** Currently set to "default_restaurant". You can change this in `.env.local` for multi-restaurant support.

---

## Troubleshooting

### Can't Login
- Check Firebase Auth is enabled for Email/Password
- Verify user exists in Firebase Authentication
- Ensure user document exists in Firestore with matching UID
- Check `isActive` field is `true`

### "User data not found" Error
- User exists in Auth but not in Firestore
- Create the user document in `restaurants/{restaurantId}/users/{userId}`

### Routes Not Working
- Clear browser cache and cookies
- Check if AuthProvider is wrapping the app in `app/layout.tsx`
- Verify environment variables are set correctly

---

## Next Steps for You

1. ✅ Configure Firebase and update `.env.local`
2. ✅ Create test users in Firebase Auth
3. ✅ Add user documents in Firestore
4. ✅ Test login with different roles
5. 🚀 Ready to build the remaining features!

The foundation is solid and production-ready. You can now proceed to build the dashboard, menu management, orders, billing, and all other features on top of this infrastructure.
