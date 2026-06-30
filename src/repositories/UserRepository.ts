import { UserProfile } from '../types';
import { StorageProvider } from '../lib/StorageProvider';

const COLLECTION = 'users';

export const UserRepository = {
  async getUser(uid: string): Promise<UserProfile | null> {
    return StorageProvider.getProvider().get<UserProfile>(COLLECTION, uid);
  },

  async saveUser(user: UserProfile): Promise<void> {
    await StorageProvider.getProvider().set<UserProfile>(COLLECTION, user.uid, user);
  },

  async updateUser(uid: string, updates: Partial<UserProfile>): Promise<void> {
    await StorageProvider.getProvider().update<UserProfile>(COLLECTION, uid, updates);
  }
};
