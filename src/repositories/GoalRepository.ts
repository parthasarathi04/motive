import { Goal } from '../types';
import { StorageProvider } from '../lib/StorageProvider';

const COLLECTION = 'goals';

export const GoalRepository = {
  async getGoals(userId: string): Promise<Goal[]> {
    return StorageProvider.getProvider().queryList<Goal>(COLLECTION, 'userId', '==', userId, 'createdAt', 'desc');
  },

  subscribeGoals(userId: string, onUpdate: (goals: Goal[]) => void): () => void {
    return StorageProvider.getProvider().subscribeList<Goal>(COLLECTION, 'userId', '==', userId, onUpdate, 'createdAt', 'desc');
  },

  async createGoal(goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>): Promise<Goal> {
    const id = 'g-' + Math.random().toString(36).substring(2, 11);
    const now = new Date().toISOString();
    const newGoal: Goal = {
      ...goal,
      id,
      createdAt: now,
      updatedAt: now,
    };
    await StorageProvider.getProvider().set<Goal>(COLLECTION, id, newGoal);
    return newGoal;
  },

  async updateGoal(userId: string, id: string, updates: Partial<Goal>): Promise<void> {
    const now = new Date().toISOString();
    await StorageProvider.getProvider().update<Goal>(COLLECTION, id, { ...updates, updatedAt: now });
  },

  async deleteGoal(userId: string, id: string): Promise<void> {
    await StorageProvider.getProvider().delete(COLLECTION, id);
  }
};
