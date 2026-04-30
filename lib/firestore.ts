import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  DocumentData,
  Query,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Get the tenant's subcollection reference.
 * All data is scoped to: tenants/{tenantId}/{collectionName}
 */
export function getTenantCollection(tenantId: string, collectionName: string) {
  return collection(db, 'tenants', tenantId, collectionName);
}

/**
 * Get document by ID from a tenant's subcollection
 */
export async function getDocumentById<T>(
  tenantId: string,
  collectionName: string,
  docId: string
): Promise<T | null> {
  try {
    const docRef = doc(getTenantCollection(tenantId, collectionName), docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as T;
    }
    return null;
  } catch (error) {
    console.error(`Error getting document from ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Get all documents from a tenant's subcollection
 */
export async function getAllDocuments<T>(
  tenantId: string,
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> {
  try {
    const collectionRef = getTenantCollection(tenantId, collectionName);
    const q = constraints.length > 0 ? query(collectionRef, ...constraints) : collectionRef;
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as T[];
  } catch (error) {
    console.error(`Error getting documents from ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Add document to a tenant's subcollection
 */
export async function addDocument<T>(
  tenantId: string,
  collectionName: string,
  data: Omit<T, 'id'>
): Promise<string> {
  try {
    const collectionRef = getTenantCollection(tenantId, collectionName);
    const docRef = await addDoc(collectionRef, {
      ...data,
      restaurantId: tenantId,
    });
    return docRef.id;
  } catch (error) {
    console.error(`Error adding document to ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Update document in a tenant's subcollection
 */
export async function updateDocument<T>(
  tenantId: string,
  collectionName: string,
  docId: string,
  data: Partial<T>
): Promise<void> {
  try {
    const docRef = doc(getTenantCollection(tenantId, collectionName), docId);
    await updateDoc(docRef, { ...data, updatedAt: Timestamp.now() });
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Delete document from a tenant's subcollection
 */
export async function deleteDocument(
  tenantId: string,
  collectionName: string,
  docId: string
): Promise<void> {
  try {
    const docRef = doc(getTenantCollection(tenantId, collectionName), docId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Subscribe to collection changes (real-time)
 */
export function subscribeToCollection<T>(
  tenantId: string,
  collectionName: string,
  callback: (data: T[]) => void,
  constraints: QueryConstraint[] = []
): () => void {
  const collectionRef = getTenantCollection(tenantId, collectionName);
  const q = constraints.length > 0 ? query(collectionRef, ...constraints) : collectionRef;

  return onSnapshot(
    q,
    (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as T[];
      callback(data);
    },
    (error) => {
      console.error(`Error subscribing to ${collectionName}:`, error);
    }
  );
}

/**
 * Subscribe to a single document (real-time)
 */
export function subscribeToDocument<T>(
  tenantId: string,
  collectionName: string,
  docId: string,
  callback: (data: T | null) => void
): () => void {
  const docRef = doc(getTenantCollection(tenantId, collectionName), docId);

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback({ id: snapshot.id, ...snapshot.data() } as T);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error(`Error subscribing to document in ${collectionName}:`, error);
    }
  );
}

/**
 * Query documents with conditions from a tenant's subcollection
 */
export async function queryDocuments<T>(
  tenantId: string,
  collectionName: string,
  conditions: { field: string; operator: any; value: any }[],
  orderByField?: string,
  limitCount?: number
): Promise<T[]> {
  try {
    const collectionRef = getTenantCollection(tenantId, collectionName);
    const constraints: QueryConstraint[] = conditions.map(({ field, operator, value }) =>
      where(field, operator, value)
    );

    if (orderByField) {
      constraints.push(orderBy(orderByField, 'desc'));
    }

    if (limitCount) {
      constraints.push(limit(limitCount));
    }

    const q = query(collectionRef, ...constraints);
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as T[];
  } catch (error) {
    console.error(`Error querying documents from ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Find customer by phone number within a tenant
 */
export async function findCustomerByPhone(
  tenantId: string,
  phone: string
): Promise<any | null> {
  try {
    if (!phone || phone.trim() === '') return null;

    const customers = await queryDocuments<any>(
      tenantId,
      'customers',
      [{ field: 'phone', operator: '==', value: phone.trim() }],
      undefined,
      1
    );

    return customers.length > 0 ? customers[0] : null;
  } catch (error) {
    console.error('Error finding customer by phone:', error);
    throw error;
  }
}

/**
 * Update customer stats after order completion
 */
export async function updateCustomerStats(
  tenantId: string,
  customerId: string,
  orderAmount: number
): Promise<void> {
  try {
    const customer = await getDocumentById<any>(tenantId, 'customers', customerId);
    if (!customer) throw new Error('Customer not found');

    const pointsEarned = Math.floor(orderAmount / 10);

    await updateDocument(tenantId, 'customers', customerId, {
      totalOrders: (customer.totalOrders || 0) + 1,
      totalSpent: (customer.totalSpent || 0) + orderAmount,
      lastVisit: Timestamp.now(),
      loyaltyPoints: (customer.loyaltyPoints || 0) + pointsEarned,
    });
  } catch (error) {
    console.error('Error updating customer stats:', error);
    throw error;
  }
}

/**
 * Create or update customer from order
 */
export async function createOrUpdateCustomerFromOrder(
  tenantId: string,
  phone: string,
  name: string,
  orderAmount: number,
  email?: string
): Promise<string> {
  try {
    const existingCustomer = await findCustomerByPhone(tenantId, phone);

    if (existingCustomer) {
      await updateCustomerStats(tenantId, existingCustomer.id, orderAmount);
      return existingCustomer.id;
    } else {
      const pointsEarned = Math.floor(orderAmount / 10);
      const customerData: any = {
        name: name.trim(),
        phone: phone.trim(),
        totalOrders: 1,
        totalSpent: orderAmount,
        lastVisit: Timestamp.now(),
        loyaltyPoints: pointsEarned,
      };

      if (email && email.trim() !== '') {
        customerData.email = email.trim();
      }

      const customerId = await addDocument(tenantId, 'customers', customerData);
      return customerId;
    }
  } catch (error) {
    console.error('Error creating/updating customer from order:', error);
    throw error;
  }
}
