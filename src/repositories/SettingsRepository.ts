import { UserSettings } from '../types';
import { StorageProvider } from '../lib/StorageProvider';

const COLLECTION = 'settings';

const getDefaultSettings = (userId: string | null): UserSettings => {
  const effectiveId = userId || 'guest';
  return {
    userId: effectiveId,
    theme: 'SYSTEM',
    calendarSync: true,
    emailSync: true,
    focusBlockSync: true,
    notifications: true,
    linkedAccounts: [
      {
        email: 'parthabhunia2001@gmail.com',
        name: 'Partha Sarathi Bhunia',
        photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        isPrimary: true,
        linkedAt: new Date().toISOString()
      }
    ]
  };
};

export const SettingsRepository = {
  async getSettings(userId: string | null): Promise<UserSettings> {
    const effectiveId = userId || 'guest';
    const settings = await StorageProvider.getProvider().get<UserSettings>(COLLECTION, effectiveId);
    if (settings) {
      if (!settings.linkedAccounts) {
        settings.linkedAccounts = getDefaultSettings(userId).linkedAccounts;
      }
      return settings;
    }
    const defaults = getDefaultSettings(userId);
    await StorageProvider.getProvider().set<UserSettings>(COLLECTION, effectiveId, defaults);
    return defaults;
  },

  async updateSettings(userId: string | null, updates: Partial<UserSettings>): Promise<void> {
    const effectiveId = userId || 'guest';
    const current = await this.getSettings(userId);
    const updated = { ...current, ...updates };
    await StorageProvider.getProvider().set<UserSettings>(COLLECTION, effectiveId, updated);
    window.dispatchEvent(new Event('motive_settings_updated'));
  }
};
