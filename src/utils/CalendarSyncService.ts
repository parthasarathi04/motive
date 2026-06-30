import { GoogleCalendarClient } from './GoogleCalendarClient';
import { CommitmentRepository } from '../repositories/CommitmentRepository';
import { TimelineRepository } from '../repositories/TimelineRepository';
import { AccountRepository } from '../repositories/AccountRepository';
import { CalendarRepository } from '../repositories/CalendarRepository';
import { Commitment, CalendarEventCache } from '../types';
import { CommitmentFactory } from './CommitmentFactory';

export const CalendarSyncService = {
  /**
   * Synchronizes the user's Google Calendar events into Commitments.
   */
  async sync(userId: string, start?: string, end?: string): Promise<void> {
    const accounts = await AccountRepository.getAccounts(userId);
    const activeAccounts = accounts.filter(a => a.status === 'ACTIVE');

    if (activeAccounts.length === 0) {
      console.warn('[CalendarSyncService] No active Google accounts connected.');
      return;
    }

    try {
      const rawEvents = await GoogleCalendarClient.fetchEvents(start, end);
      const existingComms = await CommitmentRepository.getCommitments(userId);
      let importedCount = 0;

      for (const ev of rawEvents) {
        // Normalize Google event
        const normalizedStart = ev.startTime || ev.start?.dateTime || ev.start?.date || '';
        const normalizedEnd = ev.endTime || ev.end?.dateTime || ev.end?.date || '';
        
        // Save to calendar_events cache repo
        const eventCacheItem: CalendarEventCache = {
          id: ev.id || `google-evt-${Math.random().toString(36).substring(2, 11)}`,
          calendarId: 'primary',
          accountId: activeAccounts[0].id,
          userId,
          summary: ev.title || ev.summary || 'Google Calendar Event',
          description: ev.description || '',
          start: normalizedStart,
          end: normalizedEnd,
          status: ev.status || 'confirmed',
          eTag: ev.etag || '',
          updated: ev.updated || new Date().toISOString(),
          deleted: false
        };
        await CalendarRepository.saveEvent(eventCacheItem);

        // Map to Commitment if not already existing
        const exists = existingComms.some(c => 
          (c.title === eventCacheItem.summary && c.scheduledStart === eventCacheItem.start) ||
          c.calendarEventId === eventCacheItem.id
        );

        if (!exists) {
          const commitmentPayload = CommitmentFactory.create({
            userId,
            type: 'EVENT',
            title: eventCacheItem.summary,
            description: eventCacheItem.description,
            constraint: 'FIXED',
            source: 'GOOGLE',
            accountId: activeAccounts[0].id,
            status: 'SCHEDULED',
            scheduledStart: eventCacheItem.start,
            scheduledEnd: eventCacheItem.end,
            completedAt: null,
            estimatedDuration: ev.estimatedDuration,
            goalLinks: [],
            dependencies: [],
            importance: 'MEDIUM',
            urgency: 'MEDIUM',
            impact: 'MEDIUM',
            energy: 'MEDIUM',
            calendarEventId: eventCacheItem.id,
            metadata: {}
          });

          await CommitmentRepository.createCommitment(commitmentPayload);
          importedCount++;
        }
      }

      if (importedCount > 0) {
        await TimelineRepository.createTimelineEntry({
          userId,
          type: 'CALENDAR_IMPORTED',
          entityId: userId,
          summary: `Google Calendar synced. Discovered & imported ${importedCount} upcoming events.`
        });
      }
    } catch (e) {
      console.error('[CalendarSyncService] Synchronization error:', e);
      throw e;
    }
  }
};
