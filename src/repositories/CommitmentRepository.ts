import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot,
  orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Commitment } from '../types';

const COLLECTION = 'commitments';

const isLocalMode = () => {
  return !localStorage.getItem('motive_use_cloud');
};

const getLocalCommitments = (userId: string): Commitment[] => {
  const data = localStorage.getItem(`motive_commitments_${userId}`);
  return data ? JSON.parse(data) : [];
};

const saveLocalCommitments = (userId: string, commitments: Commitment[]) => {
  localStorage.setItem(`motive_commitments_${userId}`, JSON.stringify(commitments));
};

export const CommitmentRepository = {
  async getCommitments(userId: string): Promise<Commitment[]> {
    if (isLocalMode()) {
      return getLocalCommitments(userId);
    }
    try {
      const q = query(collection(db, COLLECTION), where('userId', '==', userId), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Commitment));
    } catch (e) {
      console.warn('Firestore getCommitments failed, falling back to local', e);
      return getLocalCommitments(userId);
    }
  },

  subscribeCommitments(userId: string, onUpdate: (commitments: Commitment[]) => void): () => void {
    if (isLocalMode()) {
      const update = () => {
        onUpdate(getLocalCommitments(userId));
      };
      update();
      window.addEventListener('storage', update);
      window.addEventListener('motive_commitments_updated', update);
      return () => {
        window.removeEventListener('storage', update);
        window.removeEventListener('motive_commitments_updated', update);
      };
    }

    try {
      const q = query(collection(db, COLLECTION), where('userId', '==', userId), orderBy('createdAt', 'desc'));
      return onSnapshot(q, (snapshot) => {
        const commitments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Commitment));
        onUpdate(commitments);
      }, (err) => {
        console.warn('Firestore commitments snapshot failed, falling back to local', err);
        onUpdate(getLocalCommitments(userId));
      });
    } catch (e) {
      console.warn('Firestore commitments subscription failed', e);
      return () => {};
    }
  },

  async createCommitment(commitment: Omit<Commitment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Commitment> {
    const id = doc(collection(db, COLLECTION)).id;
    const now = new Date().toISOString();
    const newCommitment: Commitment = {
      ...commitment,
      id,
      createdAt: now,
      updatedAt: now,
    };

    if (isLocalMode()) {
      const commitments = getLocalCommitments(commitment.userId);
      commitments.unshift(newCommitment);
      saveLocalCommitments(commitment.userId, commitments);
      window.dispatchEvent(new Event('motive_commitments_updated'));
      return newCommitment;
    }

    try {
      await setDoc(doc(db, COLLECTION, id), newCommitment);
      return newCommitment;
    } catch (e) {
      console.error('Firestore createCommitment failed, fallback to local', e);
      const commitments = getLocalCommitments(commitment.userId);
      commitments.unshift(newCommitment);
      saveLocalCommitments(commitment.userId, commitments);
      window.dispatchEvent(new Event('motive_commitments_updated'));
      return newCommitment;
    }
  },

  async updateCommitment(userId: string, id: string, updates: Partial<Commitment>): Promise<void> {
    const now = new Date().toISOString();
    
    if (isLocalMode()) {
      const commitments = getLocalCommitments(userId);
      const index = commitments.findIndex(c => c.id === id);
      if (index !== -1) {
        commitments[index] = { ...commitments[index], ...updates, updatedAt: now };
        saveLocalCommitments(userId, commitments);
        window.dispatchEvent(new Event('motive_commitments_updated'));
      }
      return;
    }

    try {
      await updateDoc(doc(db, COLLECTION, id), { ...updates, updatedAt: now });
    } catch (e) {
      console.error('Firestore updateCommitment failed, fallback to local', e);
      const commitments = getLocalCommitments(userId);
      const index = commitments.findIndex(c => c.id === id);
      if (index !== -1) {
        commitments[index] = { ...commitments[index], ...updates, updatedAt: now };
        saveLocalCommitments(userId, commitments);
        window.dispatchEvent(new Event('motive_commitments_updated'));
      }
    }
  },

  async deleteCommitment(userId: string, id: string): Promise<void> {
    if (isLocalMode()) {
      const commitments = getLocalCommitments(userId);
      const filtered = commitments.filter(c => c.id !== id);
      saveLocalCommitments(userId, filtered);
      window.dispatchEvent(new Event('motive_commitments_updated'));
      return;
    }

    try {
      await deleteDoc(doc(db, COLLECTION, id));
    } catch (e) {
      console.error('Firestore deleteCommitment failed, fallback to local', e);
      const commitments = getLocalCommitments(userId);
      const filtered = commitments.filter(c => c.id !== id);
      saveLocalCommitments(userId, filtered);
      window.dispatchEvent(new Event('motive_commitments_updated'));
    }
  }
};
