import { Commitment } from '../types';
import { StorageProvider } from '../lib/StorageProvider';

const COLLECTION = 'commitments';

export const CommitmentRepository = {
  async getCommitments(userId: string): Promise<Commitment[]> {
    return StorageProvider.getProvider().queryList<Commitment>(COLLECTION, 'userId', '==', userId, 'createdAt', 'desc');
  },

  subscribeCommitments(userId: string, onUpdate: (commitments: Commitment[]) => void): () => void {
    return StorageProvider.getProvider().subscribeList<Commitment>(COLLECTION, 'userId', '==', userId, onUpdate, 'createdAt', 'desc');
  },

  async createCommitment(commitment: Omit<Commitment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Commitment> {
    const id = 'c-' + Math.random().toString(36).substring(2, 11);
    const now = new Date().toISOString();
    const newCommitment: Commitment = {
      ...commitment,
      id,
      createdAt: now,
      updatedAt: now,
    };
    await StorageProvider.getProvider().set<Commitment>(COLLECTION, id, newCommitment);
    return newCommitment;
  },

  async updateCommitment(userId: string, id: string, updates: Partial<Commitment>): Promise<void> {
    const now = new Date().toISOString();
    await StorageProvider.getProvider().update<Commitment>(COLLECTION, id, { ...updates, updatedAt: now });
  },

  async deleteCommitment(userId: string, id: string): Promise<void> {
    await StorageProvider.getProvider().delete(COLLECTION, id);
  }
};
