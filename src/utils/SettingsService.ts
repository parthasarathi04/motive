import { SettingsRepository } from '../repositories/SettingsRepository';
import { AccountRepository } from '../repositories/AccountRepository';
import { UserSettings, CalendarAccount } from '../types';

export const SettingsService = {
  async updateSettings(userId: string, updates: Partial<UserSettings>): Promise<void> {
    await SettingsRepository.updateSettings(userId, updates);
  },

  async connectAccount(userId: string, account: CalendarAccount): Promise<void> {
    await AccountRepository.saveAccount(account);
  },

  async disconnectAccount(userId: string, accountId: string): Promise<void> {
    await AccountRepository.deleteAccount(userId, accountId);
  }
};
