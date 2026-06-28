import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserSettings } from '../types';

const COLLECTION = 'settings';

const isLocalMode = () => {
  return !localStorage.getItem('motive_use_cloud');
};

const getLocalSettings = (userId: string): UserSettings => {
  const data = localStorage.getItem(`motive_settings_${userId}`);
  if (data) return JSON.parse(data);
  
  const defaultSettings: UserSettings = {
    userId,
    theme: 'LIGHT', // light mode by default
    calendarSync: true,
    gmailSync: true,
    focusBlockSync: true,
    notifications: true
  };
  localStorage.setItem(`motive_settings_${userId}`, JSON.stringify(defaultSettings));
  return defaultSettings;
};

const saveLocalSettings = (userId: string, settings: UserSettings) => {
  localStorage.setItem(`motive_settings_${userId}`, JSON.stringify(settings));
};

export const SettingsRepository = {
  async getSettings(userId: string): Promise<UserSettings> {
    if (isLocalMode()) {
      return getLocalSettings(userId);
    }
    try {
      const docRef = doc(db, COLLECTION, userId);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return snapshot.data() as UserSettings;
      } else {
        const defaults = getLocalSettings(userId);
        await setDoc(docRef, defaults);
        return defaults;
      }
    } catch (e) {
      console.warn('Firestore getSettings failed, falling back to local', e);
      return getLocalSettings(userId);
    }
  },

  async updateSettings(userId: string, updates: Partial<UserSettings>): Promise<void> {
    const current = getLocalSettings(userId);
    const updated = { ...current, ...updates };
    saveLocalSettings(userId, updated);
    window.dispatchEvent(new Event('motive_settings_updated'));

    if (isLocalMode()) {
      return;
    }

    try {
      await updateDoc(doc(db, COLLECTION, userId), updates);
    } catch (e) {
      console.error('Firestore updateSettings failed', e);
    }
  }
};
