import { 
  collection, 
  doc, 
  getDoc,
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot,
  orderBy,
  WhereFilterOp
} from 'firebase/firestore';
import { db } from './firebase';

export interface StorageProviderContract {
  get<T>(collectionName: string, id: string): Promise<T | null>;
  set<T>(collectionName: string, id: string, data: T): Promise<void>;
  update<T>(collectionName: string, id: string, data: Partial<T>): Promise<void>;
  delete(collectionName: string, id: string): Promise<void>;
  queryList<T>(
    collectionName: string, 
    field: string, 
    operator: WhereFilterOp, 
    value: any, 
    orderByField?: string, 
    orderDirection?: 'asc' | 'desc'
  ): Promise<T[]>;
  subscribeList<T>(
    collectionName: string, 
    field: string, 
    operator: WhereFilterOp, 
    value: any, 
    onUpdate: (data: T[]) => void, 
    orderByField?: string, 
    orderDirection?: 'asc' | 'desc'
  ): () => void;
}

const isLocalMode = () => {
  return !localStorage.getItem('motive_use_cloud');
};

const getLocalStorageKey = (collectionName: string, userId: string) => {
  return `motive_${collectionName}_${userId}`;
};

const loadLocalData = <T>(collectionName: string, userId: string): T[] => {
  const data = localStorage.getItem(getLocalStorageKey(collectionName, userId));
  return data ? JSON.parse(data) : [];
};

const saveLocalData = <T>(collectionName: string, userId: string, data: T[]) => {
  localStorage.setItem(getLocalStorageKey(collectionName, userId), JSON.stringify(data));
};

export const FirestoreStorageProvider: StorageProviderContract = {
  async get<T>(collectionName: string, id: string): Promise<T | null> {
    const docRef = doc(db, collectionName, id);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() } as any;
    }
    return null;
  },

  async set<T>(collectionName: string, id: string, data: T): Promise<void> {
    const docRef = doc(db, collectionName, id);
    await setDoc(docRef, data as any);
  },

  async update<T>(collectionName: string, id: string, data: Partial<T>): Promise<void> {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, data as any);
  },

  async delete(collectionName: string, id: string): Promise<void> {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  },

  async queryList<T>(
    collectionName: string, 
    field: string, 
    operator: WhereFilterOp, 
    value: any, 
    orderByField?: string, 
    orderDirection?: 'asc' | 'desc'
  ): Promise<T[]> {
    let q = query(collection(db, collectionName), where(field, operator, value));
    if (orderByField) {
      q = query(q, orderBy(orderByField, orderDirection || 'asc'));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
  },

  subscribeList<T>(
    collectionName: string, 
    field: string, 
    operator: WhereFilterOp, 
    value: any, 
    onUpdate: (data: T[]) => void, 
    orderByField?: string, 
    orderDirection?: 'asc' | 'desc'
  ): () => void {
    let q = query(collection(db, collectionName), where(field, operator, value));
    if (orderByField) {
      q = query(q, orderBy(orderByField, orderDirection || 'asc'));
    }
    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
      onUpdate(items);
    }, (err) => {
      console.warn(`Firestore subscription failed on collection ${collectionName}, using local fallback`, err);
      // fallback
      const localItems = loadLocalData<T>(collectionName, value);
      onUpdate(localItems);
    });
  }
};

export const LocalStorageProvider: StorageProviderContract = {
  async get<T>(collectionName: string, id: string): Promise<T | null> {
    // For single-doc items like settings or planner_results, they are stored under their own ID (usually userId)
    const data = localStorage.getItem(`motive_${collectionName}_single_${id}`);
    if (data) {
      return JSON.parse(data);
    }
    // Search in list-style storage if not found as single doc
    const list = localStorage.getItem(`motive_${collectionName}`);
    if (list) {
      const parsed = JSON.parse(list) as any[];
      const matched = parsed.find(item => item.id === id);
      return matched || null;
    }
    return null;
  },

  async set<T>(collectionName: string, id: string, data: T): Promise<void> {
    localStorage.setItem(`motive_${collectionName}_single_${id}`, JSON.stringify(data));
    // Also save in list style if applicable
    const userId = (data as any).userId || id;
    const list = loadLocalData<any>(collectionName, userId);
    const filtered = list.filter(item => item.id !== id);
    filtered.unshift(data);
    saveLocalData(collectionName, userId, filtered);
    window.dispatchEvent(new Event(`motive_${collectionName}_updated`));
  },

  async update<T>(collectionName: string, id: string, data: Partial<T>): Promise<void> {
    const singleKey = `motive_${collectionName}_single_${id}`;
    const singleDataStr = localStorage.getItem(singleKey);
    let userId = id;
    if (singleDataStr) {
      const singleData = JSON.parse(singleDataStr);
      const updated = { ...singleData, ...data };
      userId = updated.userId || id;
      localStorage.setItem(singleKey, JSON.stringify(updated));
    }
    
    // Also update list style
    const list = loadLocalData<any>(collectionName, userId);
    const index = list.findIndex(item => item.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...data };
      saveLocalData(collectionName, userId, list);
      window.dispatchEvent(new Event(`motive_${collectionName}_updated`));
    }
  },

  async delete(collectionName: string, id: string): Promise<void> {
    localStorage.removeItem(`motive_${collectionName}_single_${id}`);
    
    // We don't have user ID in hand, so search in all known localStorage lists
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`motive_${collectionName}_`)) {
        const dataStr = localStorage.getItem(key);
        if (dataStr) {
          try {
            const list = JSON.parse(dataStr);
            if (Array.isArray(list)) {
              const filtered = list.filter(item => item.id !== id);
              if (filtered.length !== list.length) {
                localStorage.setItem(key, JSON.stringify(filtered));
              }
            }
          } catch (e) {
            // ignore
          }
        }
      }
    }
    window.dispatchEvent(new Event(`motive_${collectionName}_updated`));
  },

  async queryList<T>(
    collectionName: string, 
    field: string, 
    operator: WhereFilterOp, 
    value: any, 
    orderByField?: string, 
    orderDirection?: 'asc' | 'desc'
  ): Promise<T[]> {
    const list = loadLocalData<T>(collectionName, value);
    if (orderByField) {
      return [...list].sort((a: any, b: any) => {
        const valA = a[orderByField];
        const valB = b[orderByField];
        if (valA < valB) return orderDirection === 'desc' ? 1 : -1;
        if (valA > valB) return orderDirection === 'desc' ? -1 : 1;
        return 0;
      });
    }
    return list;
  },

  subscribeList<T>(
    collectionName: string, 
    field: string, 
    operator: WhereFilterOp, 
    value: any, 
    onUpdate: (data: T[]) => void, 
    orderByField?: string, 
    orderDirection?: 'asc' | 'desc'
  ): () => void {
    const update = () => {
      LocalStorageProvider.queryList<T>(collectionName, field, operator, value, orderByField, orderDirection).then(onUpdate);
    };
    update();
    window.addEventListener('storage', update);
    window.addEventListener(`motive_${collectionName}_updated`, update);
    return () => {
      window.removeEventListener('storage', update);
      window.removeEventListener(`motive_${collectionName}_updated`, update);
    };
  }
};

export const StorageProvider = {
  getProvider(): StorageProviderContract {
    return isLocalMode() ? LocalStorageProvider : FirestoreStorageProvider;
  }
};
