import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  onSnapshot,
  orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Recommendation } from '../types';

const COLLECTION = 'recommendations';

const isLocalMode = () => {
  return !localStorage.getItem('motive_use_cloud');
};

const getLocalRecommendations = (userId: string): Recommendation[] => {
  const data = localStorage.getItem(`motive_recommendations_${userId}`);
  return data ? JSON.parse(data) : [];
};

const saveLocalRecommendations = (userId: string, recommendations: Recommendation[]) => {
  localStorage.setItem(`motive_recommendations_${userId}`, JSON.stringify(recommendations));
};

export const RecommendationRepository = {
  async getRecommendations(userId: string): Promise<Recommendation[]> {
    if (isLocalMode()) {
      return getLocalRecommendations(userId);
    }
    try {
      const q = query(collection(db, COLLECTION), where('userId', '==', userId), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Recommendation));
    } catch (e) {
      console.warn('Firestore getRecommendations failed, falling back to local', e);
      return getLocalRecommendations(userId);
    }
  },

  subscribeRecommendations(userId: string, onUpdate: (recommendations: Recommendation[]) => void): () => void {
    if (isLocalMode()) {
      const update = () => {
        onUpdate(getLocalRecommendations(userId));
      };
      update();
      window.addEventListener('storage', update);
      window.addEventListener('motive_recommendations_updated', update);
      return () => {
        window.removeEventListener('storage', update);
        window.removeEventListener('motive_recommendations_updated', update);
      };
    }

    try {
      const q = query(collection(db, COLLECTION), where('userId', '==', userId), orderBy('createdAt', 'desc'));
      return onSnapshot(q, (snapshot) => {
        const recommendations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Recommendation));
        onUpdate(recommendations);
      }, (err) => {
        console.warn('Firestore recommendations snapshot failed, falling back to local', err);
        onUpdate(getLocalRecommendations(userId));
      });
    } catch (e) {
      console.warn('Firestore recommendations subscription failed', e);
      return () => {};
    }
  },

  async createRecommendation(rec: Omit<Recommendation, 'id' | 'createdAt'>): Promise<Recommendation> {
    const id = doc(collection(db, COLLECTION)).id;
    const now = new Date().toISOString();
    const newRec: Recommendation = {
      ...rec,
      id,
      createdAt: now,
    };

    if (isLocalMode()) {
      const recs = getLocalRecommendations(rec.userId);
      recs.unshift(newRec);
      saveLocalRecommendations(rec.userId, recs);
      window.dispatchEvent(new Event('motive_recommendations_updated'));
      return newRec;
    }

    try {
      await setDoc(doc(db, COLLECTION, id), newRec);
      return newRec;
    } catch (e) {
      console.error('Firestore createRecommendation failed, fallback to local', e);
      const recs = getLocalRecommendations(rec.userId);
      recs.unshift(newRec);
      saveLocalRecommendations(rec.userId, recs);
      window.dispatchEvent(new Event('motive_recommendations_updated'));
      return newRec;
    }
  },

  async updateRecommendation(userId: string, id: string, updates: Partial<Recommendation>): Promise<void> {
    if (isLocalMode()) {
      const recs = getLocalRecommendations(userId);
      const index = recs.findIndex(r => r.id === id);
      if (index !== -1) {
        recs[index] = { ...recs[index], ...updates };
        saveLocalRecommendations(userId, recs);
        window.dispatchEvent(new Event('motive_recommendations_updated'));
      }
      return;
    }

    try {
      await updateDoc(doc(db, COLLECTION, id), updates);
    } catch (e) {
      console.error('Firestore updateRecommendation failed, fallback to local', e);
      const recs = getLocalRecommendations(userId);
      const index = recs.findIndex(r => r.id === id);
      if (index !== -1) {
        recs[index] = { ...recs[index], ...updates };
        saveLocalRecommendations(userId, recs);
        window.dispatchEvent(new Event('motive_recommendations_updated'));
      }
    }
  }
};
