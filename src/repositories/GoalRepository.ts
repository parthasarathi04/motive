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
import { Goal } from '../types';

const COLLECTION = 'goals';

// Helper to check if we are in local fallback mode
const isLocalMode = () => {
  return !localStorage.getItem('motive_use_cloud');
};

const getLocalGoals = (userId: string): Goal[] => {
  const data = localStorage.getItem(`motive_goals_${userId}`);
  return data ? JSON.parse(data) : [];
};

const saveLocalGoals = (userId: string, goals: Goal[]) => {
  localStorage.setItem(`motive_goals_${userId}`, JSON.stringify(goals));
};

export const GoalRepository = {
  async getGoals(userId: string): Promise<Goal[]> {
    if (isLocalMode()) {
      return getLocalGoals(userId);
    }
    try {
      const q = query(collection(db, COLLECTION), where('userId', '==', userId), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Goal));
    } catch (e) {
      console.warn('Firestore getGoals failed, falling back to local storage', e);
      return getLocalGoals(userId);
    }
  },

  subscribeGoals(userId: string, onUpdate: (goals: Goal[]) => void): () => void {
    if (isLocalMode()) {
      // Simulate snapshot listener
      const update = () => {
        onUpdate(getLocalGoals(userId));
      };
      update();
      window.addEventListener('storage', update);
      // Custom event for same-window updates
      window.addEventListener('motive_goals_updated', update);
      return () => {
        window.removeEventListener('storage', update);
        window.removeEventListener('motive_goals_updated', update);
      };
    }

    try {
      const q = query(collection(db, COLLECTION), where('userId', '==', userId), orderBy('createdAt', 'desc'));
      return onSnapshot(q, (snapshot) => {
        const goals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Goal));
        onUpdate(goals);
      }, (err) => {
        console.warn('Firestore goals snapshot failed, falling back to local', err);
        onUpdate(getLocalGoals(userId));
      });
    } catch (e) {
      console.warn('Firestore goals subscription failed', e);
      return () => {};
    }
  },

  async createGoal(goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>): Promise<Goal> {
    const id = doc(collection(db, COLLECTION)).id;
    const now = new Date().toISOString();
    const newGoal: Goal = {
      ...goal,
      id,
      createdAt: now,
      updatedAt: now,
    };

    if (isLocalMode()) {
      const goals = getLocalGoals(goal.userId);
      goals.unshift(newGoal);
      saveLocalGoals(goal.userId, goals);
      window.dispatchEvent(new Event('motive_goals_updated'));
      return newGoal;
    }

    try {
      await setDoc(doc(db, COLLECTION, id), newGoal);
      return newGoal;
    } catch (e) {
      console.error('Firestore createGoal failed, fallback to local', e);
      // Save locally too
      const goals = getLocalGoals(goal.userId);
      goals.unshift(newGoal);
      saveLocalGoals(goal.userId, goals);
      window.dispatchEvent(new Event('motive_goals_updated'));
      return newGoal;
    }
  },

  async updateGoal(userId: string, id: string, updates: Partial<Goal>): Promise<void> {
    const now = new Date().toISOString();
    
    if (isLocalMode()) {
      const goals = getLocalGoals(userId);
      const index = goals.findIndex(g => g.id === id);
      if (index !== -1) {
        goals[index] = { ...goals[index], ...updates, updatedAt: now };
        saveLocalGoals(userId, goals);
        window.dispatchEvent(new Event('motive_goals_updated'));
      }
      return;
    }

    try {
      await updateDoc(doc(db, COLLECTION, id), { ...updates, updatedAt: now });
    } catch (e) {
      console.error('Firestore updateGoal failed, fallback to local', e);
      const goals = getLocalGoals(userId);
      const index = goals.findIndex(g => g.id === id);
      if (index !== -1) {
        goals[index] = { ...goals[index], ...updates, updatedAt: now };
        saveLocalGoals(userId, goals);
        window.dispatchEvent(new Event('motive_goals_updated'));
      }
    }
  },

  async deleteGoal(userId: string, id: string): Promise<void> {
    if (isLocalMode()) {
      const goals = getLocalGoals(userId);
      const filtered = goals.filter(g => g.id !== id);
      saveLocalGoals(userId, filtered);
      window.dispatchEvent(new Event('motive_goals_updated'));
      return;
    }

    try {
      await deleteDoc(doc(db, COLLECTION, id));
    } catch (e) {
      console.error('Firestore deleteGoal failed, fallback to local', e);
      const goals = getLocalGoals(userId);
      const filtered = goals.filter(g => g.id !== id);
      saveLocalGoals(userId, filtered);
      window.dispatchEvent(new Event('motive_goals_updated'));
    }
  }
};
