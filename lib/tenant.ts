import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Tenant, Subscription, SubscriptionStatus, TenantUser, UserRole } from '@/types';

// ─── Collection Names ─────────────────────────────────────────────────────────

const TENANTS_COL = 'tenants';
const SUBSCRIPTIONS_COL = 'subscriptions';
const USER_INDEX_COL = 'user_tenant_index';

const TRIAL_DAYS = 7;

// ═══════════════════════════════════════════════════════════════════════════════
// TENANT SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

export class TenantService {
  /**
   * Create a new tenant (restaurant) and start their trial.
   * Called on signup. Owner role = 'admin' in this POS app.
   */
  static async createTenant(params: {
    restaurantName: string;
    ownerName: string;
    ownerEmail: string;
    ownerUid: string;
  }): Promise<string> {
    const now = Timestamp.now();
    const trialEnd = Timestamp.fromDate(
      new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000)
    );

    // Create tenant document
    const tenantData: Omit<Tenant, 'id'> = {
      restaurantName: params.restaurantName,
      ownerName: params.ownerName,
      ownerEmail: params.ownerEmail,
      ownerUid: params.ownerUid,
      createdAt: now,
      updatedAt: now,
    };

    const tenantRef = await addDoc(collection(db, TENANTS_COL), tenantData);
    const tenantId = tenantRef.id;

    // Create subscription with trial
    const subscriptionData: Omit<Subscription, 'id'> = {
      tenantId,
      plan: null,
      status: 'trial',
      trialStartDate: now,
      trialEndDate: trialEnd,
      createdAt: now,
      updatedAt: now,
    };
    await addDoc(collection(db, SUBSCRIPTIONS_COL), subscriptionData);

    // Create the owner user in tenant's users subcollection (role: admin)
    const ownerUser: Omit<TenantUser, 'id'> = {
      uid: params.ownerUid,
      email: params.ownerEmail,
      name: params.ownerName,
      role: 'admin',
      isActive: true,
      tenantId,
      registeredAt: now,
      createdAt: now,
      updatedAt: now,
    };
    await addDoc(collection(db, TENANTS_COL, tenantId, 'users'), ownerUser);

    return tenantId;
  }

  /**
   * Get tenant document by tenantId
   */
  static async getTenant(tenantId: string): Promise<Tenant | null> {
    const tenantRef = doc(db, TENANTS_COL, tenantId);
    const snap = await getDoc(tenantRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Tenant;
  }

  /**
   * Update restaurant profile (name, phone, address, gstin, email)
   */
  static async updateTenant(
    tenantId: string,
    updates: {
      restaurantName?: string;
      phone?: string;
      address?: string;
      gstin?: string;
      email?: string;
    }
  ): Promise<void> {
    const docRef = doc(db, TENANTS_COL, tenantId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  }

  /**
   * Get tenantId for a given Firebase Auth UID.
   * First checks tenant owner, then user_tenant_index.
   */
  static async getTenantIdByUid(uid: string): Promise<string | null> {
    // First check if user is tenant owner (fast path)
    const ownerQuery = query(
      collection(db, TENANTS_COL),
      where('ownerUid', '==', uid)
    );
    const ownerSnap = await getDocs(ownerQuery);
    if (!ownerSnap.empty) {
      return ownerSnap.docs[0].id;
    }

    // Otherwise find in global user index
    const userIndexQuery = query(
      collection(db, USER_INDEX_COL),
      where('uid', '==', uid)
    );
    const indexSnap = await getDocs(userIndexQuery);
    if (!indexSnap.empty) {
      return indexSnap.docs[0].data().tenantId as string;
    }

    return null;
  }

  /**
   * Get the user record within a tenant's users subcollection by UID
   */
  static async getTenantUser(
    tenantId: string,
    uid: string
  ): Promise<TenantUser | null> {
    const q = query(
      collection(db, TENANTS_COL, tenantId, 'users'),
      where('uid', '==', uid)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as TenantUser;
  }

  /**
   * Get all users for a tenant
   */
  static async getTenantUsers(tenantId: string): Promise<TenantUser[]> {
    const snap = await getDocs(
      collection(db, TENANTS_COL, tenantId, 'users')
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as TenantUser));
  }

  /**
   * Admin directly creates a staff account with name, email, role.
   * The Firebase Auth user is created separately via API route.
   * This just creates/updates the Firestore record.
   */
  static async createStaffUser(params: {
    tenantId: string;
    uid: string;
    email: string;
    name: string;
    role: UserRole;
    phone?: string;
  }): Promise<string> {
    const now = Timestamp.now();

    // Check if email already exists in this tenant
    const existingQ = query(
      collection(db, TENANTS_COL, params.tenantId, 'users'),
      where('email', '==', params.email)
    );
    const existingSnap = await getDocs(existingQ);
    if (!existingSnap.empty) {
      throw new Error('This email is already registered in your team.');
    }

    const staffUser: Omit<TenantUser, 'id'> = {
      uid: params.uid,
      email: params.email,
      name: params.name,
      role: params.role,
      isActive: true,
      tenantId: params.tenantId,
      phone: params.phone,
      registeredAt: now,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(
      collection(db, TENANTS_COL, params.tenantId, 'users'),
      staffUser
    );

    // Add to global user_tenant_index for quick lookup
    await addDoc(collection(db, USER_INDEX_COL), {
      email: params.email,
      tenantId: params.tenantId,
      role: params.role,
      uid: params.uid,
      createdAt: now,
    });

    return docRef.id;
  }

  /**
   * Update a staff user record within a tenant
   */
  static async updateStaffUser(
    tenantId: string,
    userId: string,
    updates: {
      name?: string;
      role?: UserRole;
      isActive?: boolean;
      phone?: string;
    }
  ): Promise<void> {
    const userRef = doc(db, TENANTS_COL, tenantId, 'users', userId);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  }

  /**
   * Remove a staff user from a tenant
   */
  static async removeStaffUser(
    tenantId: string,
    userId: string,
    email: string
  ): Promise<void> {
    const userRef = doc(db, TENANTS_COL, tenantId, 'users', userId);
    await deleteDoc(userRef);

    // Remove from global index (best-effort)
    try {
      const indexQ = query(
        collection(db, USER_INDEX_COL),
        where('email', '==', email),
        where('tenantId', '==', tenantId)
      );
      const indexSnap = await getDocs(indexQ);
      if (!indexSnap.empty) {
        await deleteDoc(indexSnap.docs[0].ref);
      }
    } catch {
      console.warn('Could not clean up user_tenant_index for:', email);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUBSCRIPTION SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

export class SubscriptionService {
  /**
   * Get subscription for a tenant
   */
  static async getSubscription(tenantId: string): Promise<Subscription | null> {
    const q = query(
      collection(db, SUBSCRIPTIONS_COL),
      where('tenantId', '==', tenantId)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as Subscription;
  }

  /**
   * Get current subscription status and trial days remaining
   */
  static async getSubscriptionStatus(tenantId: string): Promise<{
    status: SubscriptionStatus;
    trialEndsAt: Date | null;
    trialDaysRemaining: number;
    subscriptionEndsAt: Date | null;
  }> {
    const subscription = await this.getSubscription(tenantId);

    if (!subscription) {
      return {
        status: 'expired',
        trialEndsAt: null,
        trialDaysRemaining: 0,
        subscriptionEndsAt: null,
      };
    }

    const now = new Date();

    if (subscription.status === 'trial') {
      const trialEnd = subscription.trialEndDate.toDate();
      const msRemaining = trialEnd.getTime() - now.getTime();
      const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));

      if (daysRemaining === 0) {
        await this.expireTrial(subscription.id!, tenantId);
        return {
          status: 'expired',
          trialEndsAt: trialEnd,
          trialDaysRemaining: 0,
          subscriptionEndsAt: null,
        };
      }

      return {
        status: 'trial',
        trialEndsAt: trialEnd,
        trialDaysRemaining: daysRemaining,
        subscriptionEndsAt: null,
      };
    }

    if (subscription.status === 'active') {
      const subEnd = subscription.subscriptionEndDate?.toDate() ?? null;
      if (subEnd && subEnd < now) {
        await updateDoc(doc(db, SUBSCRIPTIONS_COL, subscription.id!), {
          status: 'expired',
          updatedAt: Timestamp.now(),
        });
        return {
          status: 'expired',
          trialEndsAt: null,
          trialDaysRemaining: 0,
          subscriptionEndsAt: subEnd,
        };
      }
      return {
        status: 'active',
        trialEndsAt: null,
        trialDaysRemaining: 0,
        subscriptionEndsAt: subEnd,
      };
    }

    return {
      status: subscription.status,
      trialEndsAt: null,
      trialDaysRemaining: 0,
      subscriptionEndsAt: subscription.subscriptionEndDate?.toDate() ?? null,
    };
  }

  /**
   * Expire a trial
   */
  static async expireTrial(subscriptionId: string, tenantId: string): Promise<void> {
    await updateDoc(doc(db, SUBSCRIPTIONS_COL, subscriptionId), {
      status: 'expired' as SubscriptionStatus,
      updatedAt: Timestamp.now(),
    });
  }

  /**
   * Activate subscription after Razorpay payment verification
   */
  static async activateSubscription(params: {
    tenantId: string;
    plan: 'monthly' | 'annual';
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    amount: number;
  }): Promise<void> {
    const subscription = await this.getSubscription(params.tenantId);
    if (!subscription?.id) throw new Error('Subscription not found');

    const now = new Date();
    const endDate = new Date(now);

    if (params.plan === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    await updateDoc(doc(db, SUBSCRIPTIONS_COL, subscription.id), {
      plan: params.plan,
      status: 'active' as SubscriptionStatus,
      subscriptionStartDate: Timestamp.fromDate(now),
      subscriptionEndDate: Timestamp.fromDate(endDate),
      razorpayOrderId: params.razorpayOrderId,
      razorpayPaymentId: params.razorpayPaymentId,
      razorpaySignature: params.razorpaySignature,
      amount: params.amount,
      updatedAt: Timestamp.now(),
    });
  }

  /**
   * Super Admin: Manually activate subscription (no payment)
   */
  static async manuallyActivate(params: {
    tenantId: string;
    plan: 'monthly' | 'annual';
    months?: number;
  }): Promise<void> {
    const subscription = await this.getSubscription(params.tenantId);
    if (!subscription?.id) throw new Error('Subscription not found');

    const now = new Date();
    const endDate = new Date(now);

    if (params.plan === 'annual') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + (params.months ?? 1));
    }

    await updateDoc(doc(db, SUBSCRIPTIONS_COL, subscription.id), {
      plan: params.plan,
      status: 'active' as SubscriptionStatus,
      subscriptionStartDate: Timestamp.fromDate(now),
      subscriptionEndDate: Timestamp.fromDate(endDate),
      updatedAt: Timestamp.now(),
    });
  }

  /**
   * Super Admin: Deactivate a subscription
   */
  static async deactivate(tenantId: string): Promise<void> {
    const subscription = await this.getSubscription(tenantId);
    if (!subscription?.id) throw new Error('Subscription not found');
    await updateDoc(doc(db, SUBSCRIPTIONS_COL, subscription.id), {
      status: 'expired' as SubscriptionStatus,
      updatedAt: Timestamp.now(),
    });
  }

  /**
   * Super Admin: Get all subscriptions
   */
  static async getAllSubscriptions(): Promise<Subscription[]> {
    const snap = await getDocs(collection(db, SUBSCRIPTIONS_COL));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Subscription));
  }
}
