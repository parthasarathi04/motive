import { CalendarEventCache } from '../types';
import { StorageProvider } from '../lib/StorageProvider';

const COLLECTION = 'calendar_events';

export const CalendarRepository = {
  async getEvents(userId: string): Promise<CalendarEventCache[]> {
    return StorageProvider.getProvider().queryList<CalendarEventCache>(COLLECTION, 'userId', '==', userId);
  },

  async saveEvent(event: CalendarEventCache): Promise<void> {
    await StorageProvider.getProvider().set<CalendarEventCache>(COLLECTION, event.id, event);
  },

  async deleteEvent(userId: string, id: string): Promise<void> {
    await StorageProvider.getProvider().update<CalendarEventCache>(COLLECTION, id, { deleted: true } as any);
  }
};
