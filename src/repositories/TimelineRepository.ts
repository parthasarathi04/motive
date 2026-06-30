import { TimelineEntry } from '../types';
import { StorageProvider } from '../lib/StorageProvider';

const COLLECTION = 'timeline';

export const TimelineRepository = {
  async getTimeline(userId: string): Promise<TimelineEntry[]> {
    return StorageProvider.getProvider().queryList<TimelineEntry>(COLLECTION, 'userId', '==', userId, 'createdAt', 'desc');
  },

  subscribeTimeline(userId: string, onUpdate: (timeline: TimelineEntry[]) => void): () => void {
    return StorageProvider.getProvider().subscribeList<TimelineEntry>(COLLECTION, 'userId', '==', userId, onUpdate, 'createdAt', 'desc');
  },

  async createTimelineEntry(entry: Omit<TimelineEntry, 'id' | 'createdAt'>): Promise<TimelineEntry> {
    const id = 't-' + Math.random().toString(36).substring(2, 11);
    const now = new Date().toISOString();
    const newEntry: TimelineEntry = {
      ...entry,
      id,
      createdAt: now,
    };
    await StorageProvider.getProvider().set<TimelineEntry>(COLLECTION, id, newEntry);
    return newEntry;
  }
};
