import { CalendarAccount } from '../types';
import { StorageProvider } from '../lib/StorageProvider';

const COLLECTION = 'accounts';

export const AccountRepository = {
  async getAccounts(userId: string): Promise<CalendarAccount[]> {
    return StorageProvider.getProvider().queryList<CalendarAccount>(COLLECTION, 'userId', '==', userId);
  },

  async saveAccount(account: CalendarAccount): Promise<void> {
    await StorageProvider.getProvider().set<CalendarAccount>(COLLECTION, account.id, account);
  },

  async updateAccount(userId: string, accountId: string, updates: Partial<CalendarAccount>): Promise<void> {
    await StorageProvider.getProvider().update<CalendarAccount>(COLLECTION, accountId, updates);
  },

  async deleteAccount(userId: string, accountId: string): Promise<void> {
    await StorageProvider.getProvider().delete(COLLECTION, accountId);
  }
};
